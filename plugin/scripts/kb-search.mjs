#!/usr/bin/env node
/**
 * kb-search：在命令行全文搜索知识库，和面板的搜索是同一套逻辑。只读。
 *
 *   node plugin/scripts/kb-search.mjs [知识库目录] 关键词 [关键词…] [--limit N] [--json]
 *
 * 多个关键词时，同一个小节里要全部出现。结果精确到小节，按相关程度排序：
 *   [主题] 标题 · 小节        主题页/文件.md#小节
 *   [资料] 标题 · 小节        资料页/引用名.md#小节
 *
 * 给 AI 用：资料多了以后，问答前先搜，只读命中的那几页，不必把主题页全读一遍。
 * 知识库位置：第一个参数是知识库目录就用它；否则依次找 ./知识库、当前目录、AKB_KB_DIR、~/知识库。
 */
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { search } from '../lib/index.js'

const argv = process.argv.slice(2)
const asJson = argv.includes('--json')
const li = argv.indexOf('--limit')
const limit = li !== -1 ? Math.max(1, parseInt(argv[li + 1], 10) || 10) : 10
const words = argv.filter((a, i) => !a.startsWith('--') && !(li !== -1 && i === li + 1))

const isKb = (d) => !!d && existsSync(path.join(d, '资料页'))
let kbDir = null
if (words.length > 1 && isKb(words[0])) kbDir = path.resolve(words.shift())
kbDir = kbDir || [path.join(process.cwd(), '知识库'), process.cwd(), process.env.AKB_KB_DIR, path.join(os.homedir(), '知识库')].find(isKb)

if (!kbDir) { console.error('没有找到知识库（需要有 资料页/ 文件夹）。用法：node plugin/scripts/kb-search.mjs [知识库目录] 关键词'); process.exit(2) }
if (!words.length) { console.error('请给出要搜的关键词。用法：node plugin/scripts/kb-search.mjs [知识库目录] 关键词 [关键词…]'); process.exit(2) }

const hits = (await search(kbDir, words.join(' '))).slice(0, limit)
const dir = { topic: '主题页', source: '资料页' }
const rows = hits.map((h) => ({
  kind: h.kind === 'topic' ? '主题' : '资料',
  title: h.title,
  section: h.section,
  path: dir[h.kind] + '/' + h.name + '.md' + (h.anchor ? '#' + h.anchor : ''),
  snippet: h.snippet
}))

if (asJson) {
  console.log(JSON.stringify({ kb: kbDir, q: words.join(' '), hits: rows }, null, 2))
} else if (!rows.length) {
  console.log(`没有找到「${words.join(' ')}」。`)
} else {
  console.log(`「${words.join(' ')}」命中 ${rows.length} 处${hits.length >= limit ? `（只显示前 ${limit} 处，--limit 可调）` : ''}：\n`)
  for (const r of rows) {
    console.log(`[${r.kind}] ${r.title}${r.section ? ' · ' + r.section : ''}`)
    console.log(`       ${r.path}`)
    if (r.snippet) console.log(`       ${r.snippet}`)
  }
}
