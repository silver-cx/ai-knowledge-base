# dsh-knowledge-base

[DeepSeek Harness](https://www.deepseek.com/harness/)（DSH）的知识库面板。只读展示工作区里的 `知识库/`，所有修改都通过对话交给 agent 完成。

- **全文搜索**：搜主题页和资料页的正文，多个词用空格分开；结果精确到页或小节，点开直接跳过去并高亮
- **主题页**：跨资料的结论。点结论后面的出处，跳到资料页的对应页或小节并高亮
- **资料页**：每份资料的逐页 / 逐节要点。「看原文」可以逐页翻预览图，文字类原文会自动定位到对应小节；也可以用系统默认软件打开原文件
- **带着这页去问**：把当前页作为上下文填进对话框，确认后发送
- **处理 inbox**：inbox 有新资料时一键发出指令

知识库按这个顺序找，先找到哪个用哪个：

1. 工作区里的 `知识库/`，或工作区本身就是知识库（有 `资料页/` 和 `主题页/`）
2. 环境变量 `AKB_KB_DIR` 指向的文件夹
3. 个人文件夹下的 `~/知识库/`：适合把知识库当成底座、给多个工具共用，不管打开哪个工作区都能看到
4. 仓库自带的 `示例/知识库/`，顶部有提示条

## 安装

在仓库根目录执行（`web` 换成你使用的 profile 名）：

```bash
dsh plugin --profile web add ./plugin
```

重启 DSH 后，对话右上角会多出一个书本图标。卸载：`dsh plugin --profile web remove dsh-knowledge-base`

不想敲命令，也可以在 DSH 的对话里说「帮我安装 plugin 文件夹里的知识库插件」，让 agent 执行。

## 结构

没有构建步骤，两个文件都是手写的最终产物。

- `lib/index.js`：Host 半。注册 `POST /__dsh-kb/api`（方法 `kb`、`kbPage`、`kbSearch`、`kbOpen`）和
  `GET /__dsh-kb/raw?name=<引用名>[&page=N]`。只读，只会读取资料页属性里登记、且位于 `原始资料/` 或 `预览/` 下的文件。
- `lib/client.js`：Client 半（ModuleLoader 格式）。React 面板，每 4 秒轮询一次。
  使用的 slot：`conversation.session.header.utilities`（开关）、`shell.overlay`（面板）、`conversation.input.dock`（写入对话框草稿）。
- `scripts/kb-previews.mjs`：给 PDF / PPT / Word 生成逐页预览图。

## 原文预览

PDF、PPT、Word 的「看原文」显示逐页图片，放在 `知识库/预览/<引用名>/p1.jpg…`。生成方式：

```bash
node plugin/scripts/kb-previews.mjs           # 只处理新增或更新过的资料
node plugin/scripts/kb-previews.mjs ~/知识库  # 指定知识库的位置
node plugin/scripts/kb-previews.mjs --force   # 全部重做
```

需要本机有 `pdftoppm`（poppler）；PPT、Word 还需要 LibreOffice。缺工具时脚本会跳过并说明，面板照常可用：
PDF 退回浏览器内嵌预览，Markdown / 纯文本直接显示原文，其他格式只显示资料页和「用默认软件打开」。
