#!/usr/bin/env node
/**
 * 给知识库的资料生成逐页预览图，面板的「看原文」用它。
 *
 *   node plugin/scripts/kb-previews.mjs [知识库目录] [--force] [--only 引用名]
 *
 * 知识库目录默认是仓库根目录下的 知识库/。读 资料页/*.md 的「原文件」，
 * 把每份原文件转成 预览/<引用名>/p1.jpg、p2.jpg……
 *   - PDF 直接出图；
 *   - PPT / Word / Keynote 导出的文件先用 LibreOffice 转成 PDF 再出图；
 *   - 其他格式（Markdown、纯文本、图片）跳过，面板直接显示原文。
 *
 * 只写「预览」目录，不碰原始资料。已经有预览图、且比原文件新的会跳过。
 * 需要本机装有 pdftoppm（poppler）；转 PPT / Word 还需要 soffice（LibreOffice）。
 * 缺工具时跳过对应文件并说明原因，不报错退出——没有预览图面板也能用。
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter, resolveRaw, isSafeName } from '../lib/index.js'

const args = process.argv.slice(2)
const force = args.includes('--force')
const onlyAt = args.indexOf('--only')
const only = onlyAt !== -1 ? args[onlyAt + 1] : null
const rootArg = args.find((a, i) => !a.startsWith('--') && (onlyAt === -1 || i !== onlyAt + 1))
const kbDir = path.resolve(rootArg || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '知识库'))
const pagesDir = path.join(kbDir, '资料页')
const DPI = 90
const OFFICE = new Set(['.ppt', '.pptx', '.pps', '.ppsx', '.doc', '.docx', '.odp', '.odt', '.key'])

const has = (cmd) => spawnSync(cmd, ['--version'], { stdio: 'ignore' }).error === undefined
const hasPdftoppm = spawnSync('pdftoppm', ['-v'], { stdio: 'ignore' }).error === undefined
const soffice = ['soffice', 'libreoffice', '/Applications/LibreOffice.app/Contents/MacOS/soffice'].find(has) || null

if (!existsSync(pagesDir)) {
  console.error('没有找到 ' + pagesDir + '。用法：node plugin/scripts/kb-previews.mjs [知识库目录]')
  process.exit(1)
}
if (!hasPdftoppm) {
  console.log('本机没有 pdftoppm（poppler），无法生成预览图。面板仍可使用：PDF 退回浏览器内嵌预览，其他格式只显示资料页。')
  process.exit(0)
}

const mtime = (p) => { try { return statSync(p).mtimeMs } catch { return 0 } }
let made = 0
let skipped = 0
const notes = []

for (const file of readdirSync(pagesDir).sort()) {
  if (!file.endsWith('.md') || file.startsWith('_') || file.startsWith('.')) continue
  const name = file.slice(0, -3)
  if (only && name !== only) continue
  if (!isSafeName(name)) continue
  const { meta } = parseFrontmatter(readFileSync(path.join(pagesDir, file), 'utf8'))
  const raw = resolveRaw(kbDir, meta['原文件'] || '')
  if (!raw || !existsSync(raw)) { notes.push(name + '：原文件不存在，跳过'); skipped++; continue }
  const ext = path.extname(raw).toLowerCase()
  const outDir = path.join(kbDir, '预览', name)
  if (!force && mtime(path.join(outDir, 'p1.jpg')) > mtime(raw)) { skipped++; continue }
  if (ext !== '.pdf' && !OFFICE.has(ext)) { skipped++; continue }

  const tmp = mkdtempSync(path.join(os.tmpdir(), 'kb-preview-'))
  try {
    let pdf = raw
    if (ext !== '.pdf') {
      if (!soffice) { notes.push(name + '：需要 LibreOffice 才能转 ' + ext + '，跳过'); skipped++; continue }
      const r = spawnSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', tmp, raw], { stdio: 'ignore', timeout: 10 * 60 * 1000 })
      pdf = path.join(tmp, path.basename(raw, path.extname(raw)) + '.pdf')
      if (r.status !== 0 || !existsSync(pdf)) { notes.push(name + '：转 PDF 失败，跳过'); skipped++; continue }
    }
    const r = spawnSync('pdftoppm', ['-jpeg', '-jpegopt', 'quality=80', '-r', String(DPI), pdf, path.join(tmp, 'pg')], { stdio: 'ignore', timeout: 10 * 60 * 1000 })
    const shots = readdirSync(tmp).filter((f) => /^pg-\d+\.jpg$/.test(f))
    if (r.status !== 0 || shots.length === 0) { notes.push(name + '：出图失败，跳过'); skipped++; continue }
    rmSync(outDir, { recursive: true, force: true })
    mkdirSync(outDir, { recursive: true })
    for (const f of shots) copyFileSync(path.join(tmp, f), path.join(outDir, 'p' + Number(/^pg-(\d+)/.exec(f)[1]) + '.jpg'))
    console.log(name + '：' + shots.length + ' 页')
    made++
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

for (const n of notes) console.log(n)
console.log('完成：新生成 ' + made + ' 份，跳过 ' + skipped + ' 份')
