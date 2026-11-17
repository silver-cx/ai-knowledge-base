window.__ModuleLoader__.load({
	id: "dsh-knowledge-base",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");
/**
 * dsh-knowledge-base — Client half.
 *
 * Hand-written in the ModuleLoader format (no build step). A read-only panel
 * beside the conversation: browse 主题页 and 资料页, follow citations to the
 * exact section, look at the original, and send a question about the page to
 * the chat. The only write path is putting text into the chat draft, so every
 * change still goes through the agent.
 */
const h = React.createElement
const API = '/__dsh-kb/api'
const RAW = '/__dsh-kb/raw'
const POLL_MS = 4000
const WIDTH = 480
const WIDE = 780
const LS_KEY = 'dsh-knowledge-base'

const CSS = `
.akb-toggle { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; background:transparent; border:none; color:var(--dsw-alias-label-secondary,#5f6570); cursor:pointer; }
.akb-toggle:hover { background:color-mix(in srgb,currentColor 12%,transparent); color:var(--dsw-alias-label-primary,#1f2328); }
.akb-toggle.is-on { color:#2f5bd8; }
.akb-root { --akb-fg:var(--dsw-alias-label-primary,#1f2328); --akb-fg2:var(--dsw-alias-label-secondary,#5f6570); --akb-accent:#2f5bd8; --akb-bg:#f4f5f0; --akb-card:#fff; --akb-fill:#e6e7e0; --akb-hover:color-mix(in srgb,var(--akb-fg) 4%,transparent); --akb-line:color-mix(in srgb,var(--akb-fg) 10%,transparent); --akb-warn-bg:#fbefd6; --akb-warn:#7a4b00;
  position:fixed; top:0; right:0; bottom:0; z-index:900; display:flex; flex-direction:column; box-sizing:border-box; background:var(--akb-bg); color:var(--akb-fg); border-left:1px solid var(--akb-line); font-size:14px; line-height:1.5; }
body[data-ds-dark-theme] .akb-toggle.is-on { color:#5686fe; }
body[data-ds-dark-theme] .akb-root { --akb-accent:#5686fe; --akb-bg:var(--dsw-alias-bg-base,#141518); --akb-card:color-mix(in srgb,var(--akb-fg) 7%,transparent); --akb-fill:color-mix(in srgb,var(--akb-fg) 12%,transparent); --akb-warn-bg:color-mix(in srgb,#f0b030 18%,transparent); --akb-warn:#f3c56b; }
.akb-root *, .akb-root *::before { box-sizing:border-box; }
.akb-root button { font:inherit; color:inherit; cursor:pointer; }
.akb-head { height:48px; flex:none; padding:0 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--akb-line); }
.akb-head b { font-weight:600; }
.akb-ghost { border:1px solid var(--akb-line); background:var(--akb-card); border-radius:6px; padding:3px 10px; font-size:12px; color:var(--akb-fg2); }
.akb-ghost:hover { color:var(--akb-fg); }
.akb-ghost:disabled { opacity:.45; cursor:default; }
.akb-banner { flex:none; padding:8px 16px; font-size:12px; line-height:1.55; background:var(--akb-warn-bg); color:var(--akb-warn); }
.akb-bar { flex:none; padding:12px 16px 8px; display:flex; justify-content:space-between; align-items:center; gap:8px; }
.akb-sub { display:flex; gap:4px; }
.akb-sub button { border:none; background:none; border-radius:6px; padding:5px 12px; font-size:13px; color:var(--akb-fg2); }
.akb-sub button.is-on { background:var(--akb-fill); color:var(--akb-fg); font-weight:600; }
.akb-seg { display:flex; border:1px solid var(--akb-line); border-radius:8px; overflow:hidden; background:var(--akb-card); }
.akb-seg button { border:none; background:none; padding:5px 12px; font-size:12px; color:var(--akb-fg2); }
.akb-seg button.is-on { background:var(--akb-fill); color:var(--akb-fg); font-weight:600; }
.akb-body { flex:1; min-height:0; overflow-y:auto; padding:4px 16px 16px; display:flex; flex-direction:column; gap:10px; }
.akb-meta { font-size:12px; color:var(--akb-fg2); }
.akb-row { display:flex; align-items:center; gap:8px; min-width:0; }
.akb-h { display:flex; justify-content:space-between; align-items:baseline; padding-top:8px; }
.akb-box { background:var(--akb-card); border:1px solid var(--akb-line); border-radius:10px; }
.akb-back { border:none; background:none; padding:0; color:var(--akb-accent); font-size:13px; }
.akb-empty { border:1px dashed var(--akb-line); border-radius:10px; padding:14px; font-size:13px; color:var(--akb-fg2); text-align:center; line-height:1.7; }
.akb-foot { flex:none; padding:10px 16px; border-top:1px solid var(--akb-line); background:var(--akb-card); display:flex; justify-content:space-between; align-items:center; gap:10px; }
.akb-foot span { font-size:13px; color:var(--akb-fg2); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.akb-primary { flex:none; border:none; background:var(--akb-accent); color:#fff !important; border-radius:8px; padding:7px 14px; font-size:13px; }
.akb-primary:disabled { opacity:.45; cursor:default; }
.akb-search { flex:1; min-width:0; font:inherit; font-size:13px; color:inherit; background:var(--akb-card); border:1px solid var(--akb-line); border-radius:8px; padding:5px 10px; }
.akb-search:focus { outline:none; border-color:var(--akb-accent); }
.akb-topic { text-align:left; background:var(--akb-card); border:1px solid var(--akb-line); border-radius:10px; padding:12px 14px; display:flex; flex-direction:column; gap:4px; width:100%; }
.akb-topic:hover { border-color:var(--akb-accent); }
.akb-topic b { font-weight:600; font-size:15px; }
.akb-topic .i { font-size:13px; color:var(--akb-fg2); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.akb-srcrow { display:flex; align-items:center; gap:8px; width:100%; padding:8px 14px; border:none; background:none; text-align:left; }
.akb-srcrow + .akb-srcrow { border-top:1px solid var(--akb-line); }
.akb-srcrow:hover { background:var(--akb-hover); }
.akb-srcrow .n { font-weight:600; flex:none; max-width:46%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.akb-srcrow .d { flex:1; min-width:0; font-size:12px; color:var(--akb-fg2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.akb-mine { flex:none; font-size:11px; font-weight:600; color:var(--akb-accent); border:1px solid var(--akb-accent); border-radius:4px; padding:0 5px; }
.akb-rhead { flex:none; padding:10px 16px 8px; display:flex; flex-direction:column; gap:6px; border-bottom:1px solid var(--akb-line); background:var(--akb-card); }
.akb-rhead .t { font-weight:600; font-size:15px; line-height:1.35; }
.akb-acts { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.akb-act { border:1px solid var(--akb-line); background:var(--akb-card); border-radius:6px; padding:3px 10px; font-size:12px; color:var(--akb-fg); text-decoration:none; }
.akb-act:hover { border-color:var(--akb-accent); color:var(--akb-accent); }
.akb-act.is-on { border-color:var(--akb-accent); color:var(--akb-accent); font-weight:600; }
.akb-pv { flex:none; display:flex; flex-direction:column; border-bottom:1px solid var(--akb-line); background:var(--akb-fill); }
.akb-pv-bar { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 16px; font-size:12px; color:var(--akb-fg2); }
.akb-pv-bar .nav { display:flex; align-items:center; gap:6px; }
.akb-pv-frame { width:100%; aspect-ratio:16/10; border:none; background:#fff; display:block; }
.akb-pv-img { width:100%; max-height:46vh; min-height:120px; object-fit:contain; background:#fff; display:block; }
.akb-pv-text { position:relative; max-height:42vh; overflow:auto; background:var(--akb-card); margin:0 12px 12px; border-radius:8px; border:1px solid var(--akb-line); padding:8px 0; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px; line-height:1.6; }
.akb-pv-text div { padding:0 12px; white-space:pre-wrap; word-break:break-word; min-height:1.6em; }
.akb-pv-text div.is-hit { background:color-mix(in srgb,var(--akb-accent) 16%,transparent); font-weight:600; }
.akb-md { font-size:14px; line-height:1.7; display:flex; flex-direction:column; gap:10px; padding-top:8px; }
.akb-md h1 { font-size:18px; font-weight:600; margin:4px 0 0; line-height:1.35; }
.akb-md h2 { font-size:15px; font-weight:600; margin:10px 0 0; padding-top:10px; border-top:1px solid var(--akb-line); }
.akb-md h3 { font-size:14px; font-weight:600; margin:6px 0 0; }
.akb-md h4 { font-size:13px; font-weight:600; margin:4px 0 0; color:var(--akb-fg2); }
.akb-md p { margin:0; }
.akb-md a { color:var(--akb-accent); text-decoration:none; }
.akb-md a:hover { text-decoration:underline; }
.akb-md code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px; background:var(--akb-fill); border-radius:4px; padding:1px 5px; }
.akb-md pre { margin:0; padding:10px 12px; background:var(--akb-fill); border-radius:8px; overflow-x:auto; font-size:12px; line-height:1.5; }
.akb-md blockquote { margin:0; padding:8px 12px; background:var(--akb-fill); border-radius:8px; font-size:13px; color:var(--akb-fg2); }
.akb-md .orig { font-size:12px; color:var(--akb-fg2); font-style:italic; }
.akb-md .li { display:flex; gap:8px; }
.akb-md .li > i { flex:none; font-style:normal; color:var(--akb-fg2); min-width:10px; }
.akb-md .li > span { min-width:0; }
.akb-md .list { display:flex; flex-direction:column; gap:4px; }
.akb-tw { overflow-x:auto; border:1px solid var(--akb-line); border-radius:8px; background:var(--akb-card); }
.akb-md table { border-collapse:collapse; font-size:13px; line-height:1.55; width:100%; }
.akb-md th, .akb-md td { padding:7px 10px; text-align:left; vertical-align:top; border-bottom:1px solid var(--akb-line); min-width:72px; }
.akb-md th { font-weight:600; background:var(--akb-fill); white-space:nowrap; }
.akb-md tr:last-child td { border-bottom:none; }
.akb-cite { display:inline; border:none; background:color-mix(in srgb,var(--akb-accent) 12%,transparent); color:var(--akb-accent) !important; border-radius:4px; padding:0 4px; font-size:.92em; font-weight:500; text-decoration:none !important; cursor:pointer; }
.akb-cite:hover { background:color-mix(in srgb,var(--akb-accent) 22%,transparent); }
.akb-pg { display:flex; align-items:center; gap:8px; margin:6px 0 0; scroll-margin-top:8px; }
.akb-pg .k { font-size:12px; font-weight:600; color:var(--akb-fg2); border:1px solid var(--akb-line); background:var(--akb-card); border-radius:5px; padding:0 7px; font-variant-numeric:tabular-nums; }
.akb-sum { display:flex; flex-direction:column; gap:4px; padding:8px 12px; margin-top:8px; border-radius:10px; background:var(--akb-card); border:1px solid var(--akb-line); font-size:13px; line-height:1.6; }
.akb-sum .r { display:flex; gap:10px; align-items:baseline; min-width:0; }
.akb-sum .r > b { flex:none; font-size:12px; font-weight:600; color:var(--akb-fg2); width:5.5em; white-space:nowrap; }
.akb-sum .r > div { flex:1; min-width:0; }
.akb-sum .r > div p { margin:0; }
.akb-sum.is-clamp { cursor:pointer; }
.akb-sum.is-clamp:hover { border-color:var(--akb-accent); }
.akb-sum.is-clamp .r > div { display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; }
.akb-sum .more { align-self:flex-start; border:none; background:none; padding:0; font-size:12px; color:var(--akb-accent); }
.akb-focus { display:flex; flex-direction:column; gap:8px; padding:12px 14px; border-radius:10px; background:color-mix(in srgb,var(--akb-accent) 7%,var(--akb-card)); border:1px solid color-mix(in srgb,var(--akb-accent) 30%,transparent); }
.akb-focus .top { display:flex; justify-content:space-between; align-items:center; gap:8px; }
.akb-focus .top .k { font-size:12px; font-weight:600; color:var(--akb-accent); border:1px solid color-mix(in srgb,var(--akb-accent) 40%,transparent); border-radius:5px; padding:0 7px; }
.akb-focus .nav { display:flex; gap:6px; }
.akb-gap { display:flex; flex-direction:column; gap:10px; padding:14px; border:1px dashed var(--akb-line); border-radius:10px; font-size:13px; color:var(--akb-fg2); }
.akb-gap .nav { display:flex; gap:8px; }
.akb-refs { display:flex; flex-direction:column; gap:6px; }
.akb-refs .h { font-size:12px; font-weight:600; color:var(--akb-fg2); }
.akb-ref { text-align:left; border:1px solid var(--akb-line); background:var(--akb-card); border-radius:8px; padding:7px 10px; font-size:13px; line-height:1.55; display:flex; flex-direction:column; gap:2px; }
.akb-ref:hover { border-color:var(--akb-accent); }
.akb-ref b { font-weight:600; color:var(--akb-accent); font-size:12px; }
button.k:hover { border-color:var(--akb-accent) !important; color:var(--akb-accent) !important; }
.akb-sec { display:flex; flex-direction:column; gap:6px; border-radius:10px; padding:2px 0; scroll-margin-top:8px; }
.akb-sec.is-hit { background:color-mix(in srgb,var(--akb-accent) 9%,transparent); box-shadow:0 0 0 6px color-mix(in srgb,var(--akb-accent) 9%,transparent); }
`

function injectStyles(css) {
  const el = document.createElement('style')
  el.setAttribute('data-akb', '')
  el.textContent = css
  document.head.appendChild(el)
  return () => { el.remove() }
}

const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') || {} } catch (e) { return {} }
}
const savePrefs = (patch) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(Object.assign(loadPrefs(), patch))) } catch (e) { /* storage unavailable */ }
}

/** Tiny observable store. */
const makeStore = (initial) => {
  let state = initial
  const subs = new Set()
  return {
    get: () => state,
    set: (patch) => { state = Object.assign({}, state, patch); subs.forEach((f) => f()) },
    sub: (f) => { subs.add(f); return () => subs.delete(f) }
  }
}
const useStore = (store) => {
  const [, force] = React.useState(0)
  React.useEffect(() => store.sub(() => force((x) => x + 1)), [store])
  return store.get()
}

const isUrl = (s) => /^https?:\/\//i.test(s || '')
const pad2 = (n) => String(n).padStart(2, '0')
const fmtDay = (ms) => { if (!ms) return ''; const d = new Date(ms); return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) }
const safeDecode = (x) => { try { return decodeURIComponent(x) } catch (e) { return x } }
/** Split a markdown table row into trimmed cells, honouring `\|`. */
const tableCells = (line) => {
  let t = line.trim()
  if (t.startsWith('|')) t = t.slice(1)
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1)
  return t.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'))
}
/**
 * Resolve a link inside a knowledge-base page. Returns
 * { kind, name, anchor } for a page of the knowledge base, { url } for the
 * web, or null when it points at something the panel cannot open.
 */
const resolveLink = (href, fromKind) => {
  if (isUrl(href)) return { url: href }
  const m = /^(?:\.\.?\/)*(?:(主题页|资料页)\/)?([^#/]+)\.md(?:#(.+))?$/.exec(href || '')
  if (!m) return null
  const kind = m[1] ? (m[1] === '主题页' ? 'topic' : 'source') : fromKind
  return { kind, name: safeDecode(m[2]), anchor: m[3] ? safeDecode(m[3]) : '' }
}
const ORIG = /^原文[:：]\s*(.+)$/
/** `### 小节` followed by `> 原文：Heading` → { 小节: 'Heading' }. */
const originalHeadings = (body) => {
  const map = {}
  const re = /^###\s+(.+?)\s*\r?\n+>\s*原文[:：]\s*(.+?)\s*$/gm
  let m
  while ((m = re.exec(body || ''))) map[m[1]] = m[2]
  return map
}
/**
 * Split a 资料页 into its summary parts (`## 一句话`, `## 什么时候看`, or the
 * leading `>` line) and its `###` sections, each with its own markdown text.
 */
const splitPage = (body) => {
  const h2 = {}
  const secs = []
  let intro = ''
  let h2name = null
  let sec = null
  let buf = []
  const flush = () => { if (sec !== null) { secs.push({ anchor: sec, text: buf.join('\n').trim() }); sec = null; buf = [] } }
  for (const l of String(body || '').replace(/\r\n?/g, '\n').split('\n')) {
    const m3 = /^###\s+(.+?)\s*$/.exec(l)
    const m2 = m3 ? null : /^##\s+(.+?)\s*$/.exec(l)
    if (m2) { flush(); h2name = m2[1]; h2[h2name] = ''; continue }
    if (m3) { flush(); sec = m3[1]; continue }
    if (sec !== null) { buf.push(l); continue }
    if (h2name !== null) { h2[h2name] += l + '\n'; continue }
    const q = /^>\s*(.+)$/.exec(l)
    if (!intro && q && !ORIG.test(q[1].trim())) intro = q[1].trim()
  }
  flush()
  for (const n in h2) h2[n] = h2[n].trim()
  return { intro, h2, secs }
}
const PAGE_ANCHOR = /^p(\d+)$/
/** Normalise a line of a text original for heading matching. */
const normLine = (s) => s.replace(/^\s*#+\s*/, '').replace(/^\s*[*_`]+|[*_`]+\s*$/g, '').replace(/[:：]\s*$/, '').trim()
const findLine = (lines, target) => {
  const t = normLine(target)
  let i = lines.findIndex((l) => normLine(l) === t)
  if (i === -1) i = lines.findIndex((l) => l.indexOf(t) !== -1)
  return i
}

/**
 * Minimal markdown → React for the pages the agent writes (headings, lists,
 * check lists, tables, quotes, fences, bold, code, links). `opt.link` renders
 * links; `opt.section(anchor, children)` wraps everything under a `### anchor`
 * heading so a citation can scroll to and highlight exactly that part.
 */
function renderMarkdown(body, opt) {
  let k = 0
  const inline = (text) => {
    const out = []
    const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g
    let last = 0
    let m
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index))
      if (m[1] !== undefined) out.push(h('b', { key: 'i' + (k++) }, inline(m[1])))
      else if (m[2] !== undefined) out.push(h('code', { key: 'i' + (k++) }, m[2]))
      else out.push(opt.link(m[4], m[3], 'i' + (k++)))
      last = m.index + m[0].length
    }
    if (last < text.length) out.push(text.slice(last))
    return out
  }
  const lines = String(body || '').replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  const isSpecial = (l) => /^(#{1,4}\s|>|\||```|\s*([-*]|\d+\.)\s)/.test(l)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (line.startsWith('```')) {
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++])
      i++
      blocks.push({ t: 'pre', el: h('pre', { key: 'b' + (k++) }, buf.join('\n')) })
      continue
    }
    const hd = /^(#{1,4})\s+(.*)$/.exec(line)
    if (hd) {
      blocks.push({ t: 'h', level: hd[1].length, text: hd[2].trim() })
      i++
      continue
    }
    if (line.startsWith('|') && i + 1 < lines.length && /^\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const head = tableCells(line)
      i += 2
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) rows.push(tableCells(lines[i++]))
      blocks.push({ t: 'table', el: h('div', { key: 'b' + (k++), className: 'akb-tw' }, h('table', null,
        h('thead', null, h('tr', null, head.map((c, j) => h('th', { key: j }, inline(c))))),
        h('tbody', null, rows.map((r, ri) => h('tr', { key: ri }, head.map((_, j) => h('td', { key: j }, inline(r[j] || '')))))))) })
      continue
    }
    if (line.startsWith('>')) {
      const buf = []
      while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''))
      const orig = buf.length === 1 ? ORIG.exec(buf[0].trim()) : null
      blocks.push({
        t: 'quote',
        el: orig ? h('div', { key: 'b' + (k++), className: 'orig' }, '原文：' + orig[1])
          : h('blockquote', { key: 'b' + (k++) }, buf.map((b, j) => h('div', { key: j }, inline(b))))
      })
      continue
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items = []
      while (i < lines.length) {
        const li = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i])
        if (!li) break
        let text = li[3]
        let mark = /\d/.test(li[2]) ? li[2] : '•'
        const box = /^\[( |x|X)\]\s+(.*)$/.exec(text)
        if (box) { mark = box[1] === ' ' ? '☐' : '☑'; text = box[2] }
        items.push({ depth: Math.floor(li[1].replace(/\t/g, '  ').length / 2), mark, text })
        i++
      }
      blocks.push({ t: 'list', el: h('div', { key: 'b' + (k++), className: 'list' }, items.map((it, j) => h('div', {
        key: j, className: 'li', style: it.depth ? { marginLeft: it.depth * 18 } : null
      }, h('i', null, it.mark), h('span', null, inline(it.text))))) })
      continue
    }
    const buf = [line]
    i++
    while (i < lines.length && lines[i].trim() && !isSpecial(lines[i])) buf.push(lines[i++])
    blocks.push({ t: 'p', el: h('p', { key: 'b' + (k++) }, inline(buf.join(' '))) })
  }

  // Group everything under a `###` heading into one section.
  const out = []
  let sec = null
  const flush = () => { if (sec) { out.push(opt.section(sec.anchor, sec.children, 's' + (k++))); sec = null } }
  for (const b of blocks) {
    if (b.t === 'h') {
      if (b.level <= 3) flush()
      if (b.level === 3) { sec = { anchor: b.text, children: [] }; continue }
      const el = h('h' + b.level, { key: 'b' + (k++) }, inline(b.text))
      if (sec) sec.children.push(el); else out.push(el)
      continue
    }
    if (sec) sec.children.push(b.el); else out.push(b.el)
  }
  flush()
  return out
}

function apply(ctx) {
  const slots = ctx.get('slots')
  if (slots === undefined) return
  ctx.effect(() => injectStyles(CSS))

  const prefs = loadPrefs()
  const ui = makeStore({
    open: prefs.open === true, wide: false, note: null,
    view: prefs.view === 'sources' ? 'sources' : 'topics', query: '', mine: false,
    page: null, stack: [], preview: prefs.preview === true, previewPage: 1, textTarget: '', focusSec: '', sumOpen: false, hit: 0
  })
  const kb = makeStore({ index: null, page: null, pageError: null, text: null })
  let draftWriter = null
  let rootHint = ''

  const call = async (method, args) => {
    const r = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, args: Object.assign({ root: rootHint }, args || {}) })
    })
    return r.json()
  }
  const rawUrl = (name) => RAW + '?name=' + encodeURIComponent(name) + '&root=' + encodeURIComponent(rootHint)

  /** Load the index, and (re)load the open page when it is missing or changed on disk. */
  const refresh = async () => {
    try {
      const index = await call('kb')
      kb.set({ index })
      const cur = ui.get().page
      if (!cur || !index.ok) return
      const list = cur.kind === 'topic' ? index.topics : index.sources
      const entry = (list || []).find((x) => x.name === cur.name)
      const loaded = kb.get().page
      const same = loaded && loaded.kind === cur.kind && loaded.name === cur.name
      if (same && entry && entry.mtime === loaded.mtime) return
      const page = await call('kbPage', { kind: cur.kind, name: cur.name })
      const now = ui.get().page
      if (!now || now.kind !== cur.kind || now.name !== cur.name) return
      if (page.ok) kb.set({ page, pageError: null })
      else kb.set({ page: null, pageError: page.message || '读取失败' })
    } catch (e) {
      kb.set({ index: kb.get().index || { ok: false, error: 'network', message: '读取失败：' + String((e && e.message) || e) } })
    }
  }
  /** Fetch the text of a plain-text original once per source. */
  const loadText = async (name) => {
    const t = kb.get().text
    if (t && t.name === name) return
    kb.set({ text: { name, lines: null } })
    try {
      const r = await fetch(rawUrl(name))
      const body = r.ok ? await r.text() : ''
      if (kb.get().text && kb.get().text.name === name) kb.set({ text: { name, lines: r.ok ? body.replace(/\r\n?/g, '\n').split('\n') : [], failed: !r.ok } })
    } catch (e) {
      kb.set({ text: { name, lines: [], failed: true } })
    }
  }
  const openPage = (target, push) => {
    const s = ui.get()
    const stack = push && s.page ? s.stack.concat([s.page]) : push ? s.stack : []
    const pageNo = /^p(\d+)$/.exec(target.anchor || '')
    ui.set({
      page: { kind: target.kind, name: target.name, anchor: target.anchor || '' }, stack,
      previewPage: pageNo ? Number(pageNo[1]) : 1, textTarget: '', focusSec: target.anchor || '', hit: s.hit + 1
    })
    const loaded = kb.get().page
    if (!loaded || loaded.kind !== target.kind || loaded.name !== target.name) kb.set({ page: null, pageError: null })
    refresh()
  }
  const closePage = () => {
    const s = ui.get()
    if (s.stack.length) {
      const prev = s.stack[s.stack.length - 1]
      ui.set({ page: prev, stack: s.stack.slice(0, -1), textTarget: '', focusSec: prev.anchor || '', hit: s.hit + 1 })
      kb.set({ page: null, pageError: null })
      refresh()
    } else {
      ui.set({ page: null, stack: [] })
    }
  }
  const flash = (note) => { ui.set({ note }); setTimeout(() => ui.set({ note: null }), 3500) }

  /** Put text into the chat draft; the user reviews and sends it. */
  const toChat = (text) => {
    const w = draftWriter
    if (w) {
      const cur = (w.getDraft() || '').trim()
      w.setDraft(cur ? cur + '\n\n' + text : text)
      flash('已填入对话框，确认后发送')
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => flash('已复制，请粘贴到对话框'), () => flash('请先打开一个对话'))
    } else {
      flash('请先打开一个对话')
    }
  }

  // ---------- docking: make room beside the conversation ----------
  const centerCol = () => { try { return document.querySelector('[class*="centerCol"]') } catch (e) { return null } }
  const applyDock = (w) => {
    const el = centerCol()
    if (!el) return
    const left = el.getBoundingClientRect().left
    const pad = Math.max(Math.min(w, window.innerWidth - left - 400), 0)
    el.style.marginRight = pad > 0 ? pad + 'px' : ''
  }
  const clearDock = () => { const el = centerCol(); if (el) el.style.marginRight = '' }

  const Toggle = () => {
    const s = useStore(ui)
    return h('button', {
      className: 'akb-toggle' + (s.open ? ' is-on' : ''), type: 'button',
      title: '知识库', 'aria-label': '知识库', 'aria-pressed': s.open,
      onClick: () => { savePrefs({ open: !s.open }); ui.set({ open: !s.open }) }
    }, h('svg', { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      h('path', { d: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z' }), h('path', { d: 'M4 19V5M9 7h6M9 11h6' })))
  }

  // Invisible dock: captures the draft writer of the current input.
  const DraftBridge = (props) => {
    const draft = props.useInput ? props.useInput((x) => x.draft) : ''
    const ref = React.useRef(draft)
    ref.current = draft
    React.useEffect(() => {
      const setDraft = props.inputActions && props.inputActions.setDraft
      if (!setDraft) return
      const me = { setDraft, getDraft: () => ref.current }
      draftWriter = me
      return () => { if (draftWriter === me) draftWriter = null }
    }, [props.sessionId, props.inputActions])
    return null
  }

  // ---------- lists ----------
  const matches = (q, ...fields) => !q || fields.some((f) => String(f || '').toLowerCase().indexOf(q) !== -1)
  const Topics = (index, s) => {
    const q = s.query.trim().toLowerCase()
    const list = index.topics.filter((t) => matches(q, t.name, t.title, t.intro))
    return h(React.Fragment, null,
      index.topics.length === 0 ? h('div', { className: 'akb-empty' }, '还没有主题页。把资料放进 知识库/inbox，然后在对话里说「处理 inbox」') : null,
      index.topics.length > 0 && list.length === 0 ? h('div', { className: 'akb-empty' }, '没有匹配的主题页') : null,
      list.map((t) => h('button', {
        key: t.name, type: 'button', className: 'akb-topic', onClick: () => openPage({ kind: 'topic', name: t.name }, false)
      }, h('b', null, t.title), t.intro ? h('span', { className: 'i' }, t.intro) : null,
      h('span', { className: 'akb-meta' }, '引用 ' + t.sources + ' 份资料' + (t.mtime ? ' · ' + fmtDay(t.mtime) + ' 更新' : '')))))
  }
  const Sources = (index, s) => {
    const q = s.query.trim().toLowerCase()
    const list = index.sources.filter((x) => (!s.mine || x.mine) && matches(q, x.name, x.title, x.type, x.author, x.origin))
    const types = [...new Set(list.map((x) => x.type || '其他'))]
    return h(React.Fragment, null,
      index.sources.length === 0 ? h('div', { className: 'akb-empty' }, '还没有资料页') : null,
      index.sources.length > 0 && list.length === 0 ? h('div', { className: 'akb-empty' }, '没有匹配的资料') : null,
      types.map((tp) => {
        const items = list.filter((x) => (x.type || '其他') === tp)
        return h(React.Fragment, { key: tp },
          h('div', { className: 'akb-h' }, h('b', { style: { fontSize: 13 } }, tp), h('span', { className: 'akb-meta' }, items.length + ' 份')),
          h('div', { className: 'akb-box' }, items.map((x) => h('button', {
            key: x.name, type: 'button', className: 'akb-srcrow', title: x.title, onClick: () => openPage({ kind: 'source', name: x.name }, false)
          }, h('span', { className: 'n' }, x.name),
          x.mine ? h('span', { className: 'akb-mine' }, '我写的') : null,
          h('span', { className: 'd' }, [x.author || x.origin, /^\d+$/.test(x.pages) ? x.pages + ' 页' : '',
            x.refs ? '被 ' + x.refs + ' 个主题引用' : '未被引用'].filter(Boolean).join(' · '))))))
      }))
  }

  // ---------- reader ----------
  const Reader = (index, s, page, err, text) => {
    const cur = s.page
    const src = cur.kind === 'source' ? (index.sources || []).find((x) => x.name === cur.name) : null
    const kind = src ? src.preview : ''
    const byImage = kind === 'pages'
    const paged = byImage || kind === 'pdf'
    const total = byImage ? src.previewPages : (src && /^\d+$/.test(src.pages) ? Number(src.pages) : 0)
    const origs = page && cur.kind === 'source' ? originalHeadings(page.body) : {}
    const goPage = (n) => ui.set({ preview: true, previewPage: Math.max(1, total ? Math.min(total, n) : n) })
    const goText = (heading, anchor) => ui.set({ preview: true, textTarget: heading, focusSec: anchor || s.focusSec, hit: s.hit + 1 })
    /** Focus one section: scroll a text original to it, or just show it. */
    const focusOn = (anchor) => (kind === 'text' && origs[anchor] ? goText(origs[anchor], anchor) : ui.set({ focusSec: anchor }))
    const link = (href, label, key) => {
      const t = resolveLink(href, cur.kind)
      if (!t) return h('span', { key }, label)
      if (t.url) return h('a', { key, href: t.url, target: '_blank', rel: 'noreferrer noopener' }, label)
      return h('a', {
        key, href: '#', className: t.kind === 'source' && cur.kind === 'topic' ? 'akb-cite' : null,
        title: (t.kind === 'source' ? '资料页：' : '主题页：') + t.name + (t.anchor ? ' · ' + t.anchor : ''),
        onClick: (e) => { e.preventDefault(); openPage(t, true) }
      }, label)
    }
    const section = (anchor, children, key) => {
      // 主题页的三级标题就是普通小标题；资料页的三级标题是页码或小节名，做成可定位的块。
      if (cur.kind === 'topic') return h(React.Fragment, { key }, h('h3', null, anchor), children)
      const pageNo = /^p(\d+)$/.exec(anchor)
      const hit = cur.anchor && cur.anchor === anchor
      let tag = h('span', { className: 'k' }, anchor)
      if (paged && pageNo) tag = h('button', { type: 'button', className: 'k', title: '看原文这一页', onClick: () => goPage(Number(pageNo[1])) }, anchor + ' · 看原文')
      else if (kind === 'text' && origs[anchor]) tag = h('button', { type: 'button', className: 'k', title: '在原文中定位：' + origs[anchor], onClick: () => goText(origs[anchor], anchor) }, anchor + ' · 看原文')
      return h('div', { key, className: 'akb-sec' + (hit ? ' is-hit' : ''), 'data-akb-anchor': anchor }, h('div', { className: 'akb-pg' }, tag), children)
    }
    const title = src ? src.title : ((index.topics || []).find((t) => t.name === cur.name) || {}).title || cur.name
    const head = h('div', { className: 'akb-rhead' },
      h('div', { className: 'akb-row', style: { justifyContent: 'space-between' } },
        h('button', { type: 'button', className: 'akb-back', onClick: closePage },
          s.stack.length ? '‹ 返回上一页' : (cur.kind === 'topic' ? '‹ 全部主题' : '‹ 全部资料')),
        h('span', { className: 'akb-meta' }, cur.kind === 'topic' ? '主题页' : '资料页')),
      h('div', { className: 't' }, title),
      src ? h('div', { className: 'akb-acts' },
        kind ? h('button', {
          type: 'button', className: 'akb-act' + (s.preview ? ' is-on' : ''), 'aria-pressed': s.preview,
          onClick: () => { savePrefs({ preview: !s.preview }); ui.set({ preview: !s.preview }) }
        }, s.preview ? '收起原文' : '看原文') : null,
        src.hasRaw ? h('button', {
          type: 'button', className: 'akb-act',
          onClick: () => call('kbOpen', { name: src.name }).then(
            (r) => flash(r.ok ? '已交给系统打开原文件' : (r.message || '打不开原文件')), () => flash('打不开原文件'))
        }, '用默认软件打开') : null,
        isUrl(src.online) ? h('a', { className: 'akb-act', href: src.online, target: '_blank', rel: 'noreferrer noopener' }, '在线版') : null,
        h('span', { className: 'akb-meta' }, [src.type, src.mine ? '我写的' : '', src.read].filter(Boolean).join(' · '))) : null)

    let preview = null
    if (kind && s.preview) {
      const url = rawUrl(src.name)
      let view
      if (kind === 'text') {
        const lines = text && text.name === src.name ? text.lines : null
        const target = s.textTarget || origs[cur.anchor] || ''
        const at = lines && target ? findLine(lines, target) : -1
        view = h('div', { className: 'akb-pv-text', 'data-akb-text': '1', 'data-akb-at': at },
          !lines ? h('div', null, '读取中…')
            : text.failed ? h('div', null, '读取原文失败')
              : lines.map((l, i) => h('div', { key: i, className: i === at ? 'is-hit' : null }, l)))
      } else if (byImage) {
        view = h('img', { key: s.previewPage, className: 'akb-pv-img', alt: '原文第 ' + s.previewPage + ' 页', src: url + '&page=' + Math.min(s.previewPage, total) })
      } else if (kind === 'pdf') {
        view = h('iframe', { key: src.name + ':' + s.previewPage, className: 'akb-pv-frame', title: '原文预览', src: url + '#page=' + s.previewPage + '&view=FitH&toolbar=0&navpanes=0' })
      } else {
        view = h('img', { className: 'akb-pv-img', alt: '原文', src: url })
      }
      preview = h('div', { className: 'akb-pv' },
        h('div', { className: 'akb-pv-bar' },
          h('span', null, kind === 'text' ? '原文 · 滚动时下方记录跟着换' : paged ? '原文预览 · 翻页时下方记录跟着换' : '原图'),
          paged ? h('span', { className: 'nav' },
            h('button', { type: 'button', className: 'akb-ghost', disabled: s.previewPage <= 1, onClick: () => goPage(s.previewPage - 1) }, '‹ 上一页'),
            h('b', { style: { color: 'var(--akb-fg)', fontVariantNumeric: 'tabular-nums' } }, s.previewPage + (total ? ' / ' + total : '')),
            h('button', { type: 'button', className: 'akb-ghost', disabled: !!total && s.previewPage >= total, onClick: () => goPage(s.previewPage + 1) }, '下一页 ›')) : null),
        view)
    }
    // 对照模式：原文开着时，下方只显示当前这一页（或这一节）的记录，翻页跟着走。
    const focus = !!(page && kind && s.preview && (paged || kind === 'text'))
    const md = (text) => h('div', { className: 'akb-md', style: { paddingTop: 0 } }, renderMarkdown(text, { link, section }))
    let content = null
    if (focus) {
      const sp = splitPage(page.body)
      const one = sp.h2['一句话'] || sp.intro || ''
      const when = sp.h2['什么时候看'] || ''
      const byPage = paged && sp.secs.some((x) => PAGE_ANCHOR.test(x.anchor))
      const curAnchor = byPage ? 'p' + s.previewPage
        : (sp.secs.some((x) => x.anchor === s.focusSec) ? s.focusSec : (sp.secs[0] || {}).anchor || '')
      const at = sp.secs.findIndex((x) => x.anchor === curAnchor)
      const sec = at === -1 ? null : sp.secs[at]
      const pagesWithNotes = byPage ? sp.secs.map((x) => PAGE_ANCHOR.exec(x.anchor)).filter(Boolean).map((m) => Number(m[1])) : []
      const prevNote = pagesWithNotes.filter((n) => n < s.previewPage).pop()
      const nextNote = pagesWithNotes.filter((n) => n > s.previewPage)[0]
      const refs = (page.citedBy || []).filter((c) => c.anchor && c.anchor === curAnchor)
      // 收起时每项只占一行，点一下展开全文。
      const sum = one || when ? h('div', {
        className: 'akb-sum' + (s.sumOpen ? '' : ' is-clamp'), title: s.sumOpen ? null : '点击展开全文',
        onClick: s.sumOpen ? null : () => ui.set({ sumOpen: true })
      },
      one ? h('div', { className: 'r' }, h('b', null, '一句话'), md(one)) : null,
      when ? h('div', { className: 'r' }, h('b', null, '什么时候看'), md(when)) : null,
      s.sumOpen ? h('button', { type: 'button', className: 'more', onClick: () => ui.set({ sumOpen: false }) }, '收起') : null) : null
      const card = sec
        ? h('div', { className: 'akb-focus' },
          h('div', { className: 'top' },
            h('span', { className: 'k' }, byPage ? '第 ' + s.previewPage + ' 页' : curAnchor),
            byPage ? null : h('span', { className: 'nav' },
              h('button', { type: 'button', className: 'akb-ghost', disabled: at <= 0, onClick: () => focusOn(sp.secs[at - 1].anchor) }, '‹ 上一节'),
              h('button', { type: 'button', className: 'akb-ghost', disabled: at >= sp.secs.length - 1, onClick: () => focusOn(sp.secs[at + 1].anchor) }, '下一节 ›'))),
          md(sec.text))
        : h('div', { className: 'akb-gap' },
          byPage ? '第 ' + s.previewPage + ' 页没有单独记录，多为封面、目录或过渡页。' : '这份资料还没有分节记录。',
          byPage && (prevNote || nextNote) ? h('div', { className: 'nav' },
            prevNote ? h('button', { type: 'button', className: 'akb-ghost', onClick: () => goPage(prevNote) }, '‹ 看 p' + prevNote) : null,
            nextNote ? h('button', { type: 'button', className: 'akb-ghost', onClick: () => goPage(nextNote) }, '看 p' + nextNote + ' ›') : null) : null)
      const refBox = refs.length ? h('div', { className: 'akb-refs' },
        h('div', { className: 'h' }, '这一' + (byPage ? '页' : '节') + '被主题页引用'),
        refs.map((c, i) => h('button', {
          key: i, type: 'button', className: 'akb-ref', title: '打开主题页：' + c.title,
          onClick: () => openPage({ kind: 'topic', name: c.topic }, true)
        }, h('b', null, c.title), c.text ? h('span', null, c.text) : null))) : null
      content = h(React.Fragment, null, sum, card, refBox)
    }
    const body = h('div', { className: 'akb-body', 'data-akb-reader': '1' },
      err ? h('div', { className: 'akb-empty', style: { marginTop: 12 } }, err)
        : !page ? h('div', { className: 'akb-empty', style: { marginTop: 12 } }, '读取中…')
          : focus ? content
            : h('div', { className: 'akb-md' }, renderMarkdown(page.body, { link, section })))
    return { head, preview, body, title }
  }

  // ---------- the panel ----------
  const Panel = (props) => {
    const s = useStore(ui)
    const k = useStore(kb)
    const sid = props.useSessions ? props.useSessions((x) => x.current) : null
    const items = props.useWorkspaces ? props.useWorkspaces((x) => x.items) : null
    const recentId = props.useWorkspaces ? props.useWorkspaces((x) => x.recentWorkspaceId) : null
    const ws = (items || []).find((w) => w.sessionIds && w.sessionIds.indexOf(sid) !== -1)
      || (items || []).find((w) => w.workspaceId === recentId) || (items || [])[0]
    rootHint = (ws && ws.path) || ''
    const width = s.wide ? WIDE : WIDTH

    React.useEffect(() => {
      if (!s.open) return
      refresh()
      const t = setInterval(() => { if (!document.hidden) refresh() }, POLL_MS)
      return () => clearInterval(t)
    }, [s.open, rootHint])
    // After a jump, bring the cited section into view.
    const pageKey = k.page ? k.page.kind + '/' + k.page.name : ''
    React.useEffect(() => {
      if (!s.open || !s.page || !k.page) return
      const box = document.querySelector('.akb-root [data-akb-reader]')
      if (!box) return
      const anchor = s.page.anchor
      let el = null
      if (anchor) box.querySelectorAll('[data-akb-anchor]').forEach((n) => { if (!el && n.getAttribute('data-akb-anchor') === anchor) el = n })
      if (el) el.scrollIntoView({ block: 'start' }); else box.scrollTop = 0
    }, [s.open, s.hit, pageKey])
    // Plain-text originals: load once, then scroll to the located line.
    const src = s.page && s.page.kind === 'source' && k.index && k.index.ok ? (k.index.sources || []).find((x) => x.name === s.page.name) : null
    const textName = s.open && s.preview && src && src.preview === 'text' ? src.name : ''
    React.useEffect(() => { if (textName) loadText(textName) }, [textName])
    const textReady = k.text && k.text.name === textName && k.text.lines ? textName : ''
    React.useEffect(() => {
      if (!textReady) return
      const box = document.querySelector('.akb-root [data-akb-text]')
      if (!box) return
      const at = Number(box.getAttribute('data-akb-at'))
      const row = at >= 0 ? box.children[at] : null
      box.scrollTop = row ? Math.max(0, row.offsetTop - 8) : 0
    }, [textReady, s.hit, pageKey])
    // Text originals: the section shown below follows what is scrolled to the top of the original.
    React.useEffect(() => {
      if (!textReady || !k.page) return
      const box = document.querySelector('.akb-root [data-akb-text]')
      if (!box) return
      const lines = k.text.lines
      const origs = originalHeadings(k.page.body)
      const marks = splitPage(k.page.body).secs
        .map((x) => ({ anchor: x.anchor, line: origs[x.anchor] ? findLine(lines, origs[x.anchor]) : -1 }))
        .filter((m) => m.line >= 0).sort((a, b) => a.line - b.line)
      if (!marks.length) return
      let raf = 0
      const onScroll = () => {
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          const kids = box.children
          const y = box.scrollTop + 12
          let lo = 0
          let hi = kids.length - 1
          while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (kids[mid].offsetTop <= y) lo = mid; else hi = mid - 1 }
          let cur = marks[0]
          for (const m of marks) if (m.line <= lo) cur = m
          if (cur.anchor !== ui.get().focusSec) ui.set({ focusSec: cur.anchor })
        })
      }
      box.addEventListener('scroll', onScroll)
      return () => { box.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
    }, [textReady, pageKey, s.preview])
    React.useEffect(() => {
      if (!s.open) return
      const dock = () => applyDock(width)
      dock()
      window.addEventListener('resize', dock)
      return () => { window.removeEventListener('resize', dock); clearDock() }
    }, [s.open, width, sid])

    if (!s.open) return null
    const index = k.index
    const head = h('div', { className: 'akb-head' }, h('b', null, '知识库'),
      h('div', { className: 'akb-row' },
        h('button', { type: 'button', className: 'akb-ghost', onClick: () => ui.set({ wide: !s.wide }) }, s.wide ? '收窄' : '展开'),
        h('button', { type: 'button', className: 'akb-ghost', 'aria-label': '关闭知识库', onClick: () => { savePrefs({ open: false }); ui.set({ open: false }) } }, '✕')))
    const banner = index && index.ok && index.example
      ? h('div', { className: 'akb-banner', role: 'note' }, '正在看示例知识库。想建自己的，在对话里说「初始化知识库」。') : null
    const shell = (...children) => h('aside', { className: 'akb-root', style: { width: 'min(' + width + 'px, 100vw)' }, 'aria-label': '知识库' }, head, banner, ...children)
    const foot = (label, btn, text, disabled) => h('div', { className: 'akb-foot' },
      h('span', { role: 'status' }, s.note || label),
      h('button', { type: 'button', className: 'akb-primary', disabled: !!disabled, onClick: () => toChat(text) }, btn))

    if (!index) return shell(h('div', { className: 'akb-body' }, h('div', { className: 'akb-empty', style: { marginTop: 12 } }, '读取中…')))
    if (!index.ok) {
      return shell(h('div', { className: 'akb-body' }, h('div', { className: 'akb-empty', style: { marginTop: 12 } },
        index.error === 'no-kb' ? '当前工作区里还没有知识库。把本项目的文件夹设为工作区，或在对话里说「初始化知识库」。' : (index.message || index.error))),
      foot('', '← 初始化知识库', '初始化知识库', false))
    }

    if (s.page) {
      const loaded = k.page && k.page.kind === s.page.kind && k.page.name === s.page.name ? k.page : null
      const r = Reader(index, s, loaded, k.pageError, k.text)
      const where = (s.page.kind === 'topic' ? '主题页/' : '资料页/') + s.page.name
      return shell(r.head, r.preview, r.body,
        foot('就「' + r.title + '」提问', '← 带着这页去问', '请基于知识库的「' + where + '」回答（需要时回原始资料核对，回答带出处）：\n', false))
    }
    const anyMine = index.sources.some((x) => x.mine)
    const bar = h('div', { className: 'akb-bar' },
      h('div', { className: 'akb-sub' }, [['topics', '主题 ' + index.topics.length], ['sources', '资料 ' + index.sources.length]].map(([key, label]) => h('button', {
        key, type: 'button', 'aria-pressed': s.view === key, className: s.view === key ? 'is-on' : '',
        onClick: () => { savePrefs({ view: key }); ui.set({ view: key }) }
      }, label))),
      s.view === 'sources' && anyMine ? h('div', { className: 'akb-seg' }, [[false, '全部'], [true, '我写的']].map(([v, label]) => h('button', {
        key: label, type: 'button', 'aria-pressed': s.mine === v, className: s.mine === v ? 'is-on' : '', onClick: () => ui.set({ mine: v })
      }, label))) : null)
    const search = h('div', { className: 'akb-bar', style: { paddingTop: 0 } }, h('input', {
      className: 'akb-search', type: 'search', value: s.query, 'aria-label': '筛选',
      placeholder: s.view === 'topics' ? '按标题筛选主题页' : '按名称、类型、作者筛选资料',
      onChange: (e) => ui.set({ query: e.target.value })
    }))
    return shell(bar, search,
      h('div', { className: 'akb-body' }, s.view === 'topics' ? Topics(index, s) : Sources(index, s)),
      index.example
        ? foot('先问问示例知识库试试', '← 问一个问题', '请基于示例知识库回答，回答带出处：写一份提案时，最容易被评审挑战的是哪几处？', false)
        : foot(index.inbox ? 'inbox 里有 ' + index.inbox + ' 份新资料待处理' : (index.latest ? '最近：' + index.latest : 'inbox 是空的'),
          '← 处理 inbox', '处理 inbox', index.inbox === 0))
  }

  slots.inject('conversation.session.header.utilities', () => slots.register(
    { name: 'conversation.session.header.utilities', id: 'kb-toggle', label: '知识库', order: 21 },
    (props) => h(Toggle, props)
  ))
  slots.inject('conversation.input.dock', () => slots.register(
    { name: 'conversation.input.dock', id: 'kb-draft-bridge', label: '知识库', order: 91 },
    (props) => h(DraftBridge, props)
  ))
  slots.inject('shell.overlay', () => slots.register(
    { name: 'shell.overlay', id: 'kb-panel', order: 21 },
    (props) => h(Panel, props)
  ))
}

		exports.apply = apply;
		return module.exports;
	}
});
