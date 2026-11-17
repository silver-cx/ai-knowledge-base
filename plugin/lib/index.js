/**
 * dsh-knowledge-base — Host half.
 *
 * Read-only. Serves the knowledge base of the current workspace to the panel:
 *   - `POST /__dsh-kb/api` with { method, args } → JSON
 *       kb      目录：主题页、资料页清单，inbox 待处理数，最近一条日志
 *       kbPage  一页主题页或资料页的正文
 *       kbOpen  用系统默认软件打开某份资料的原文件
 *       kbSearch 全文搜索主题页和资料页，命中到小节
 *   - `GET /__dsh-kb/raw?name=<引用名>[&page=N]` → one preview page image, or
 *     the original when the browser can show it (PDF, image, plain text).
 *
 * Where the knowledge base lives, first match wins:
 *   <workspace>/知识库/           the user's own
 *   <workspace>/                  the workspace *is* a knowledge base (has 资料页/ and 主题页/)
 *   $AKB_KB_DIR, then ~/知识库/   a standalone knowledge base outside the workspace
 *   <workspace>/示例/知识库/      the bundled example, shown with a banner
 *
 * It never writes. Every change goes through the agent, which edits the files
 * following AGENTS.md. Files are only served from 原始资料/ and 预览/, and only
 * when a 资料页 names them.
 */
import { createReadStream } from 'node:fs'
import { readFile, readdir, stat } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

export const name = 'dsh-knowledge-base'

export const inject = ['webServer']

const KINDS = { topic: '主题页', source: '资料页' }
const RAW_DIRS = ['原始资料', '预览']
const MIME = {
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp'
}
const TEXT = new Set(['.md', '.markdown', '.txt', '.rst', '.org', '.csv'])
const TEXT_MAX = 2 * 1024 * 1024

/** Parse a leading `---` frontmatter block of `key: value` lines. */
export function parseFrontmatter(text) {
  const out = { meta: {}, body: text }
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return out
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.search(/[:：]/)
    if (i <= 0) continue
    out.meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  out.body = text.slice(m[0].length)
  return out
}

const isHidden = (n) => n.startsWith('.') || n.startsWith('_')

async function listDir(dir) {
  try {
    return await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

async function isFile(p) {
  try {
    return (await stat(p)).isFile()
  } catch {
    return false
  }
}

async function isDir(p) {
  try {
    return (await stat(p)).isDirectory()
  } catch {
    return false
  }
}

/** A page name is a bare file stem: no separators, no traversal, not hidden. */
export const isSafeName = (n) => typeof n === 'string' && n.length > 0 && n.length <= 120 &&
  !/[\\/\0]/.test(n) && n !== '.' && n !== '..' && !isHidden(n)

/** Resolve `rel` under the knowledge base, only inside 原始资料/ or 预览/. Null when it escapes. */
export function resolveRaw(kbDir, rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel)) return null
  const abs = path.resolve(kbDir, rel)
  for (const d of RAW_DIRS) {
    const root = path.resolve(kbDir, d) + path.sep
    if (abs.startsWith(root)) return abs
  }
  return null
}

/** The knowledge base inside `root`, or null. */
export async function findKb(root) {
  const own = path.join(root, '知识库')
  if (await isDir(own)) return { dir: own, example: false }
  if (await isDir(path.join(root, '资料页')) && await isDir(path.join(root, '主题页'))) return { dir: root, example: false }
  const example = path.join(root, '示例', '知识库')
  if (await isDir(example)) return { dir: example, example: true }
  return null
}

const PAGE_IMG = /^p(\d+)\.(jpg|jpeg|png|webp)$/i

/** Page images made at ingest time: 预览/<引用名>/p1.jpg … */
async function pageImages(kbDir, name) {
  const files = new Map()
  for (const e of await listDir(path.join(kbDir, '预览', name))) {
    const m = e.isFile() ? PAGE_IMG.exec(e.name) : null
    if (m) files.set(Number(m[1]), e.name)
  }
  let count = 0
  for (const n of files.keys()) if (n > count) count = n
  return { count, files }
}

/**
 * What the panel can show inline for a source, best first: page images, a PDF
 * preview copy, or the original itself when the browser can render it.
 */
async function previewOf(kbDir, name, rawRel) {
  const pages = await pageImages(kbDir, name)
  if (pages.count > 0) return { kind: 'pages', count: pages.count }
  const copy = path.join(kbDir, '预览', name + '.pdf')
  if (await isFile(copy)) return { kind: 'pdf', file: copy }
  const abs = resolveRaw(kbDir, rawRel)
  if (!abs || !(await isFile(abs))) return null
  const ext = path.extname(abs).toLowerCase()
  if (ext === '.pdf') return { kind: 'pdf', file: abs }
  if (MIME[ext]) return { kind: 'image', file: abs }
  if (TEXT.has(ext)) return { kind: 'text', file: abs }
  return null
}

async function readKbFile(kbDir, kind, name) {
  const dir = KINDS[kind]
  if (!dir || !isSafeName(name)) return null
  const file = path.join(kbDir, dir, name + '.md')
  try {
    const [text, st] = await Promise.all([readFile(file, 'utf8'), stat(file)])
    const parsed = parseFrontmatter(text)
    return { meta: parsed.meta, body: parsed.body, mtime: st.mtimeMs }
  } catch {
    return null
  }
}

const mdNames = async (dir) => (await listDir(dir))
  .filter((e) => e.isFile() && !isHidden(e.name) && e.name.endsWith('.md'))
  .map((e) => e.name.slice(0, -3))

const plain = (line) => line
  .replace(/〔[^〕]*〕/g, '')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\*\*|`/g, '')
  .replace(/^\s*(?:[-*]|\d+\.)\s+(?:\[[ xX]\]\s+)?/, '')
  .replace(/^\|\s*|\s*\|$/g, '').replace(/\s*\|\s*/g, ' · ')
  .replace(/(?:\s*·\s*){2,}/g, ' · ').replace(/^\s*·\s*|\s*·\s*$/g, '')
  .trim()

/** Every place a 主题页 cites `name`: { topic, title, anchor, text } with the citing line as context. */
async function citedBy(kbDir, name) {
  const out = []
  const seen = new Set()
  for (const topic of (await mdNames(path.join(kbDir, KINDS.topic))).sort((a, b) => a.localeCompare(b, 'zh', { numeric: true }))) {
    const page = await readKbFile(kbDir, 'topic', topic)
    if (!page) continue
    const title = ((/^#\s+(.+)$/m.exec(page.body) || [])[1] || topic).trim()
    for (const line of page.body.split(/\r?\n/)) {
      for (const m of line.matchAll(/\]\(\.\.\/资料页\/([^)#]+)\.md(?:#([^)]+))?\)/g)) {
        let target = m[1]
        let anchor = m[2] || ''
        try { target = decodeURIComponent(target); anchor = decodeURIComponent(anchor) } catch { /* keep as written */ }
        if (target !== name) continue
        let text = plain(line)
        if (text.length > 90) text = text.slice(0, 89) + '…'
        const key = topic + '\n' + anchor + '\n' + text
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ topic, title, anchor, text })
      }
    }
  }
  return out
}

/** A standalone knowledge base: $AKB_KB_DIR, then ~/知识库. */
async function standaloneKb() {
  for (const dir of [process.env.AKB_KB_DIR, path.join(os.homedir(), '知识库')]) {
    if (typeof dir !== 'string' || !path.isAbsolute(dir)) continue
    if (await isDir(path.join(dir, KINDS.source)) || await isDir(path.join(dir, KINDS.topic))) return { dir, example: false }
  }
  return null
}

/** Split a page body into blocks under its headings: [{ anchor, level, text }]. */
function blocksOf(body) {
  const out = [{ anchor: '', level: 0, lines: [] }]
  for (const l of String(body || '').replace(/\r\n?/g, '\n').split('\n')) {
    const m = /^(#{1,3})\s+(.+?)\s*$/.exec(l)
    if (m && m[1].length >= 2) { out.push({ anchor: m[2], level: m[1].length, lines: [] }); continue }
    if (m) continue
    out[out.length - 1].lines.push(l)
  }
  return out.map((b) => ({ anchor: b.anchor, level: b.level, text: b.lines.map(plain).filter(Boolean).join(' ') }))
}

/** Full-text search over 主题页 and 资料页; every term must appear in the hit block. */
async function search(kbDir, q) {
  const terms = [...new Set(String(q || '').toLowerCase().split(/\s+/).filter(Boolean))].slice(0, 6)
  if (!terms.length) return []
  const hits = []
  for (const kind of ['topic', 'source']) {
    for (const name of await mdNames(path.join(kbDir, KINDS[kind]))) {
      const page = await readKbFile(kbDir, kind, name)
      if (!page) continue
      const title = (page.meta['标题'] || (/^#\s+(.+)$/m.exec(page.body) || [])[1] || name).trim()
      const head = (name + ' ' + title + ' ' + (page.meta['类型'] || '') + ' ' + (page.meta['领域'] || '')).toLowerCase()
      const found = []
      for (const b of blocksOf(page.body)) {
        const hay = (b.anchor + ' ' + b.text).toLowerCase()
        if (!terms.every((t) => hay.includes(t) || head.includes(t))) continue
        if (!terms.some((t) => hay.includes(t))) continue
        let score = 0
        for (const t of terms) {
          if (head.includes(t)) score += 4
          if (b.anchor.toLowerCase().includes(t)) score += 3
          score += Math.min(hay.split(t).length - 1, 5)
        }
        const low = b.text.toLowerCase()
        const at = Math.min(...terms.map((t) => { const i = low.indexOf(t); return i === -1 ? Infinity : i }))
        const from = at === Infinity ? 0 : Math.max(0, at - 24)
        const snippet = (from > 0 ? '…' : '') + b.text.slice(from, from + 90) + (b.text.length > from + 90 ? '…' : '')
        // Topic pages scroll to any heading; 资料页 only to their ### sections.
        const anchor = kind === 'source' && b.level !== 3 ? '' : b.anchor
        const section = b.anchor
        found.push({ score, anchor, section, snippet })
      }
      if (!found.length && terms.every((t) => head.includes(t))) found.push({ score: 4 * terms.length, anchor: '', section: '', snippet: '' })
      found.sort((a, b) => b.score - a.score)
      for (const f of found.slice(0, 3)) hits.push(Object.assign({ kind, name, title }, f))
    }
  }
  hits.sort((a, b) => b.score - a.score || (a.kind === b.kind ? 0 : a.kind === 'topic' ? -1 : 1))
  return hits.slice(0, 40)
}

/** First value of a multi-value field: 「产品方法、增长」→「产品方法」. */
const firstOf = (v) => String(v || '').split(/[、,，/]/)[0].trim()
const listOf = (v) => String(v || '').split(/[、,，/]/).map((x) => x.trim()).filter(Boolean)

/** The domain list from 偏好.md: the table whose first header cell is 领域, in its order. */
async function domainList(kbDir) {
  let text = ''
  try { text = await readFile(path.join(kbDir, '偏好.md'), 'utf8') } catch { return [] }
  const out = []
  let inTable = false
  for (const line of text.split(/\r?\n/)) {
    const cells = /^\s*\|/.test(line) ? line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()) : null
    if (!cells) { inTable = false; continue }
    if (cells[0] === '领域') { inTable = true; continue }
    if (!inTable || /^:?-+:?$/.test(cells[0]) || !cells[0]) continue
    out.push(cells[0])
  }
  return [...new Set(out)]
}

async function readKb(kbDir) {
  const topics = []
  const refs = new Map()
  for (const name of (await mdNames(path.join(kbDir, KINDS.topic))).sort((a, b) => a.localeCompare(b, 'zh', { numeric: true }))) {
    const page = await readKbFile(kbDir, 'topic', name)
    if (!page) continue
    const title = (/^#\s+(.+)$/m.exec(page.body) || [])[1] || name
    const intro = (/^>\s*(.+)$/m.exec(page.body) || [])[1] || ''
    const cited = new Set()
    for (const m of page.body.matchAll(/\]\(\.\.\/资料页\/([^)#]+)\.md/g)) cited.add(m[1])
    for (const c of cited) refs.set(c, (refs.get(c) || 0) + 1)
    const sections = page.body.split(/\r?\n/).filter((l) => /^##\s/.test(l) && !/可读性说明\s*$/.test(l)).length
    topics.push({
      name, title: title.trim(), intro: intro.trim(), sources: cited.size, mtime: page.mtime, sections,
      domain: firstOf(page.meta['领域']), also: listOf(page.meta['也相关']), aboutMe: /^是/.test(page.meta['关于我'] || '')
    })
  }

  const sources = []
  for (const name of await mdNames(path.join(kbDir, KINDS.source))) {
    const page = await readKbFile(kbDir, 'source', name)
    if (!page) continue
    const m = page.meta
    const preview = await previewOf(kbDir, name, m['原文件'] || '')
    const rawAbs = resolveRaw(kbDir, m['原文件'] || '')
    sources.push({
      name,
      title: m['标题'] || name,
      type: m['类型'] || '',
      author: m['作者'] || '',
      origin: m['来源'] || '',
      date: m['日期'] || '',
      pages: m['页数'] || '',
      read: m['读取方式'] || '',
      compiled: m['编译日期'] || '',
      online: m['在线版'] || '',
      raw: m['原文件'] || '',
      mine: /^是/.test(m['本人撰写'] || ''),
      scope: m['范围'] || '',
      domain: firstOf(m['领域']),
      hasRaw: !!rawAbs && (await isFile(rawAbs)),
      preview: preview ? preview.kind : '',
      previewPages: preview && preview.count ? preview.count : 0,
      refs: refs.get(name) || 0,
      mtime: page.mtime
    })
  }
  sources.sort((a, b) => a.name.localeCompare(b.name, 'zh', { numeric: true }))

  const inbox = (await listDir(path.join(kbDir, 'inbox'))).filter((e) => !isHidden(e.name)).length
  let latest = ''
  try {
    const log = await readFile(path.join(kbDir, '日志.md'), 'utf8')
    const heads = log.match(/^##\s+.+$/gm)
    if (heads && heads.length) latest = heads[heads.length - 1].replace(/^##\s+/, '').trim()
  } catch { /* no log yet */ }
  return { topics, sources, inbox, latest, domains: await domainList(kbDir) }
}

export function apply(ctx) {
  const base = '/__dsh-kb'

  /**
   * The workspace that holds the knowledge base. The client's hint wins when it
   * has one; otherwise ask the host's workspace registry, then the process.
   */
  async function resolveKb(hint) {
    const candidates = []
    if (typeof hint === 'string' && path.isAbsolute(hint)) candidates.push(hint)
    try {
      const registry = ctx.get('workspaceRegistry')
      if (registry && typeof registry.list === 'function') {
        for (const ws of registry.list()) if (ws && typeof ws.path === 'string') candidates.push(ws.path)
      }
    } catch { /* service not present */ }
    try {
      const sp = ctx.get('sandboxPolicy')
      if (sp && sp.workspaceRoot) candidates.push(sp.workspaceRoot)
    } catch { /* service not present */ }
    for (const key of ['DSH_WORKSPACE_ROOT', 'DSH_WORKSPACE', 'INIT_CWD', 'PWD']) {
      const value = process.env[key]
      if (typeof value === 'string' && path.isAbsolute(value)) candidates.push(value)
    }
    candidates.push(process.cwd())

    const seen = new Set()
    const roots = candidates.filter((p) => typeof p === 'string' && path.isAbsolute(p) && !seen.has(p) && seen.add(p))
    // An own knowledge base anywhere beats the example; the hinted workspace is checked first,
    // then a standalone one (~/知识库) that several apps share.
    let fallback = null
    for (const root of roots) {
      const kb = await findKb(root)
      if (kb && !kb.example) return kb
      if (kb && !fallback) fallback = kb
    }
    return (await standaloneKb()) || fallback
  }

  const noKb = { ok: false, error: 'no-kb', message: '当前工作区里没有知识库' }

  const api = {
    async kb(args) {
      const kb = await resolveKb(args.root)
      if (!kb) return noKb
      return Object.assign({ ok: true, example: kb.example }, await readKb(kb.dir))
    },

    async kbPage(args) {
      const kb = await resolveKb(args.root)
      if (!kb) return noKb
      const page = await readKbFile(kb.dir, args.kind, args.name)
      if (!page) return { ok: false, error: 'not-found', message: '没有找到这一页：' + String(args.name) }
      const extra = args.kind === 'source' ? { citedBy: await citedBy(kb.dir, args.name) } : {}
      return Object.assign({ ok: true, kind: args.kind, name: args.name }, page, extra)
    },

    async kbSearch(args) {
      const kb = await resolveKb(args.root)
      if (!kb) return noKb
      const q = String(args.q || '').slice(0, 200)
      return { ok: true, q, hits: await search(kb.dir, q) }
    },

    /** 用系统默认软件打开某份资料的原文件。只认资料页属性里登记的路径。 */
    async kbOpen(args) {
      const kb = await resolveKb(args.root)
      if (!kb) return noKb
      const page = await readKbFile(kb.dir, 'source', args.name)
      const abs = page ? resolveRaw(kb.dir, page.meta['原文件'] || '') : null
      if (!abs || !(await isFile(abs))) return { ok: false, error: 'not-found', message: '原文件不在了' }
      const [cmd, argv] = process.platform === 'darwin' ? ['open', [abs]]
        : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', abs]]
          : ['xdg-open', [abs]]
      try {
        const child = spawn(cmd, argv, { detached: true, stdio: 'ignore' })
        child.on('error', () => { /* nothing opens; the user sees that */ })
        child.unref()
      } catch (e) {
        return { ok: false, error: 'open-failed', message: '打不开：' + String((e && e.message) || e) }
      }
      return { ok: true }
    }
  }

  const serveRaw = async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const name = url.searchParams.get('name') || ''
    const fail = (code, msg) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(msg) }
    const kb = await resolveKb(url.searchParams.get('root') || '')
    if (!kb || !isSafeName(name)) return fail(404, 'not found')
    const page = await readKbFile(kb.dir, 'source', name)
    if (!page) return fail(404, 'not found')
    let preview
    const pageNo = url.searchParams.get('page')
    if (pageNo !== null) {
      const n = Number(pageNo)
      const file = Number.isInteger(n) && n > 0 ? (await pageImages(kb.dir, name)).files.get(n) : null
      if (!file) return fail(404, 'no such page')
      preview = { file: path.join(kb.dir, '预览', name, file) }
    } else {
      preview = await previewOf(kb.dir, name, page.meta['原文件'] || '')
      if (!preview || !preview.file) return fail(404, 'no preview')
    }
    let st
    try { st = await stat(preview.file) } catch { return fail(404, 'not found') }
    const ext = path.extname(preview.file).toLowerCase()
    const text = TEXT.has(ext)
    if (text && st.size > TEXT_MAX) return fail(413, 'too large')
    res.writeHead(200, {
      'Content-Type': text ? 'text/plain; charset=utf-8' : (MIME[ext] || 'application/octet-stream'),
      'Content-Length': st.size,
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=60',
      'X-Content-Type-Options': 'nosniff'
    })
    createReadStream(preview.file).on('error', () => res.destroy()).pipe(res)
  }

  const send = (res, code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    res.end(JSON.stringify(obj))
  }

  const handle = async (req, res) => {
    if (req.method === 'GET' && /\/raw(\?|$)/.test(req.url || '')) {
      try { return await serveRaw(req, res) } catch { res.destroy(); return }
    }
    if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' })
    let body = ''
    req.setEncoding('utf8')
    for await (const chunk of req) {
      body += chunk
      if (body.length > 64 * 1024) return send(res, 413, { ok: false, error: 'request too large' })
    }
    let payload
    try {
      payload = body ? JSON.parse(body) : {}
    } catch {
      return send(res, 400, { ok: false, error: '请求体不是合法 JSON' })
    }
    const fn = Object.hasOwn(api, payload.method) ? api[payload.method] : null
    if (!fn) return send(res, 404, { ok: false, error: '未知方法: ' + String(payload.method) })
    try {
      send(res, 200, await fn(payload.args || {}))
    } catch (e) {
      send(res, 500, { ok: false, error: String((e && e.message) || e) })
    }
  }

  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: base, handler: handle }))
}
