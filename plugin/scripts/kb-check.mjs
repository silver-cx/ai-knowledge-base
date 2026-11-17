#!/usr/bin/env node
/**
 * kb-check：知识库的机械校验。只读，不改任何文件。
 *
 *   node plugin/scripts/kb-check.mjs [知识库目录] [--strict] [--json]
 *
 * 不给目录时依次找：./知识库、当前目录本身（有 资料页/）、环境变量 AKB_KB_DIR、~/知识库。
 *
 * 错误（退出码 1）：
 *   - 主题页里的出处指向不存在的资料页，或 # 后面的小节在资料页里找不到
 *   - 主题页之间的链接指向不存在的主题页
 *   - 资料页缺必填属性（标题、类型、读取方式，以及 原文件 或 在线版 之一）
 *   - 资料页的 原文件 在磁盘上找不到
 *   - 引用名不合规（含空格或 / \，以 . 或 _ 开头，超过 40 个字），或和属性区的 引用名 不一致
 * 提醒（--strict 时也算错误）：
 *   - 没被任何主题页引用的资料页
 *   - 资料页没填 范围、领域，或领域是 待归类；主题页没填 领域
 *   - 资料页的 ### 小节名含空格
 *   - 资料页里还留着手写的「被这些主题页引用」
 *
 * 规则说明见 AGENTS.md。体检时先跑它，AI 只处理脚本查不了的部分（内容对不对、结论有没有矛盾）。
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const strict = args.includes('--strict')
const asJson = args.includes('--json')
const dirArg = args.find((a) => !a.startsWith('--'))

const isKb = (d) => !!d && existsSync(path.join(d, '资料页'))
const kbDir = path.resolve(
  [dirArg, path.join(process.cwd(), '知识库'), process.cwd(), process.env.AKB_KB_DIR, path.join(os.homedir(), '知识库')]
    .find(isKb) || dirArg || '.'
)

const SRC = '资料页'
const TOPIC = '主题页'

function parse(text) {
  const out = { meta: {}, body: text }
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return out
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i > 0) out.meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  out.body = text.slice(m[0].length)
  return out
}

async function pages(sub) {
  let names = []
  try { names = await readdir(path.join(kbDir, sub)) } catch { return [] }
  const out = []
  for (const f of names.sort()) {
    if (!f.endsWith('.md') || f.startsWith('_') || f.startsWith('.')) continue
    const text = await readFile(path.join(kbDir, sub, f), 'utf8')
    const p = parse(text)
    out.push({ name: f.slice(0, -3), file: sub + '/' + f, meta: p.meta, body: p.body })
  }
  return out
}

const lineOf = (body, idx) => body.slice(0, idx).split('\n').length
const dec = (s) => { try { return decodeURIComponent(s) } catch { return s } }

const errors = []
const warns = []
const err = (file, msg) => errors.push({ file, msg })
const warn = (file, msg) => warns.push({ file, msg })

if (!isKb(kbDir)) {
  console.error('没有找到知识库：' + kbDir + '（需要有 资料页/ 文件夹）')
  process.exit(2)
}

const sources = await pages(SRC)
const topics = await pages(TOPIC)
const srcByName = new Map(sources.map((s) => [s.name, s]))
const headingsOf = new Map(sources.map((s) => [s.name, new Set([...s.body.matchAll(/^###\s+(.+?)\s*$/gm)].map((m) => m[1]))]))
const topicNames = new Set(topics.map((t) => t.name))
const usesDomain = [...sources, ...topics].some((p) => p.meta['领域'])

// ---- 主题页：出处和互链
const cited = new Set()
let links = 0
for (const t of topics) {
  const fm = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(await readFile(path.join(kbDir, t.file), 'utf8'))
  const offset = fm ? fm[0].split('\n').length - 1 : 0
  for (const m of t.body.matchAll(/\]\(\.\.\/资料页\/([^)#]+?)\.md(?:#([^)]+))?\)/g)) {
    links++
    const name = dec(m[1])
    const anchor = m[2] ? dec(m[2]) : ''
    const at = t.file + ':' + (lineOf(t.body, m.index) + offset)
    if (!srcByName.has(name)) { err(at, `出处指向的资料页不存在：${name}`); continue }
    cited.add(name)
    if (anchor && !headingsOf.get(name).has(anchor)) err(at, `资料页「${name}」里没有小节「### ${anchor}」`)
  }
  for (const m of t.body.matchAll(/\]\((?!\.\.\/|https?:|#)([^)#]+?\.md)(?:#[^)]*)?\)/g)) {
    const target = dec(m[1]).replace(/^\.\//, '').replace(/\.md$/, '')
    if (!topicNames.has(target)) err(t.file + ':' + (lineOf(t.body, m.index) + offset), `链接的主题页不存在：${target}`)
  }
  if (usesDomain && !t.meta['领域']) warn(t.file, '主题页没填 领域')
}

// ---- 资料页：属性、原文件、引用名、小节
for (const s of sources) {
  const m = s.meta
  if (/[\s/\\]/.test(s.name) || s.name.length > 40) err(s.file, '引用名不合规：不能含空格或 / \\，不超过 40 个字')
  if (m['引用名'] && m['引用名'] !== s.name) err(s.file, `属性区的引用名「${m['引用名']}」和文件名不一致`)
  for (const k of ['标题', '类型', '读取方式']) if (!m[k]) err(s.file, `缺必填属性：${k}`)
  if (!m['原文件'] && !m['在线版']) err(s.file, '缺必填属性：原文件 或 在线版（至少一个）')
  if (m['原文件']) {
    const raw = path.resolve(kbDir, m['原文件'])
    if (!raw.startsWith(kbDir + path.sep)) err(s.file, '原文件 指到了知识库外面：' + m['原文件'])
    else if (!existsSync(raw)) err(s.file, '原文件 找不到：' + m['原文件'])
  }
  if (!m['范围']) warn(s.file, '没填 范围（私密 / 工作 / 可公开）')
  else if (!/^(私密|工作|可公开)/.test(m['范围'])) warn(s.file, '范围 只能是 私密、工作、可公开：' + m['范围'])
  if (!m['领域']) warn(s.file, '没填 领域')
  else if (/待归类/.test(m['领域'])) warn(s.file, '领域 还是 待归类')
  for (const h of headingsOf.get(s.name)) if (/\s/.test(h)) warn(s.file, `小节名含空格，出处链接会断：### ${h}`)
  if (/^##\s+被这些主题页引用/m.test(s.body)) warn(s.file, '还留着手写的「被这些主题页引用」，引用关系由面板自动计算，这一节可以删掉')
  if (!cited.has(s.name)) warn(s.file, '没被任何主题页引用（孤立资料）')
}

// ---- 报告
const result = {
  kb: kbDir, sources: sources.length, topics: topics.length, links,
  errors, warnings: warns, ok: errors.length === 0 && (!strict || warns.length === 0)
}
if (asJson) {
  console.log(JSON.stringify(result, null, 2))
} else {
  const group = (list) => {
    const by = new Map()
    for (const x of list) { const f = x.file.split(':')[0]; if (!by.has(f)) by.set(f, []); by.get(f).push(x) }
    for (const [f, xs] of by) {
      console.log('  ' + f)
      for (const x of xs) console.log('    - ' + (x.file.includes(':') ? '第 ' + x.file.split(':')[1] + ' 行：' : '') + x.msg)
    }
  }
  console.log(`知识库：${kbDir}`)
  console.log(`资料页 ${sources.length} 份 · 主题页 ${topics.length} 份 · 出处链接 ${links} 处\n`)
  if (errors.length) { console.log(`错误 ${errors.length} 处（必须修）：`); group(errors); console.log('') }
  if (warns.length) { console.log(`提醒 ${warns.length} 处：`); group(warns); console.log('') }
  console.log(result.ok ? (errors.length || warns.length ? '通过（有提醒）' : '全部通过') : '未通过')
}
process.exit(result.ok ? 0 : 1)
