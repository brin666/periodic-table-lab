# 元素之间 · 互动元素周期表

一个面向初高中学习与自主探索的中英双语化学网站。首次访问默认显示简体中文，可在页面中切换英文；之后会保留已保存的语言偏好。

[打开在线演示](https://brin666.github.io/demos/periodic-table/) · [English README](README.en.md) · [第三方来源与复用说明](THIRD_PARTY_NOTICES.md)

本仓库提供独立的项目源码。在线演示目前由现有网站单独托管；本仓库不包含 Pages 自动发布配置。

## 可以探索什么

- 浏览完整的 118 元素周期表，查看元素资料、电子层和关联物质。
- 进入 25 个重点元素知识导图，阅读 228 张去重知识卡，并查看卡片来源。
- 在本地收录的无机化合物集合中按元素发现化合物；这不是通用化学数据库或反应预测器。
- 查看基于 NUBASE2020 整理的基态核素索引。
- 使用键盘和触屏浏览；界面支持窄屏布局与减少动态效果设置。

### 科学内容范围

周期表覆盖 118 个元素，但知识导图只覆盖 25 个重点元素。化合物发现功能使用本站整理的无机化合物集合，不代表所有已知化合物。核素浏览器收录 3555 条 NUBASE2020 基态索引记录；该版本的文献截止日期为 2020-10-30，包含估算条目和一条存在性待确认记录，因此不代表实时或完整的已发现核素普查。教材匹配按页面来源和核对状态标注；页面标注的公开版本不一定与每位读者手中的具体印次一致。

## 本地运行

需要 Node.js 20.19+ 或 22.12+，以及 npm。克隆仓库后，在项目根目录执行：

```sh
git clone https://github.com/brin666/periodic-table-lab.git
cd periodic-table-lab
npm ci
npm run dev
```

开发服务器会输出本地访问地址。常用检查与构建命令：

```sh
npm test                 # 数据与逻辑测试
npm run typecheck        # TypeScript 类型检查
npm run build            # 生成知识包并构建到 dist/
npx playwright install chromium # 首次运行浏览器用例前安装 Chromium
npm run test:browser     # CHROMIUM_PATH 可选：指定现有 Chromium 可执行文件
```

`npm run dev` 和 `npm run build` 会自动运行知识包生成脚本。需要单独重建时执行 `npm run generate:knowledge-packs`。

`npm test` 无需联网，会使用 `tests/fixtures/` 中的离线来源夹具：559 份精简 PubChem 化合物属性 JSON，以及保留原始字节并按哈希核对的 NUBASE2020 数值表。夹具不包含教材 PDF 或第三方文章正文；`knowledge-copy-before.json` 是项目自有内容的回归快照。

## 代码结构

- `src/`：React + TypeScript 界面与交互。
- `src/data/`：元素、物质、方程式、化合物、核素和来源元数据；`knowledge-packs.generated/` 是生成文件。
- `src/i18n/`：英文界面及内容映射。
- `public/stickers/knowledge-20261017/`：公开版本当前知识卡使用的 228 张 WebP 贴纸。旧氢卡素材仅作为本地历史资料保留，不随本仓库发布。
- `scripts/`：知识包构建脚本。
- `server/`：可选的匿名反馈接收服务，配置方式见 [server/README.md](server/README.md)。
- `tests/`：数据、逻辑与浏览器测试。

## 可选反馈服务

网站可以连接单独部署的反馈接收服务。按 `server/README.md` 在服务端配置。运行 `npm run feedback:local` 前，先在本机将 `FEEDBACK_GITHUB_OWNER` 和 `FEEDBACK_GITHUB_REPO` 设置为你自己专门用于公开反馈的仓库；启动脚本当前默认指向 `brin666/periodic-table-feedback`。脚本默认读取本机 GitHub CLI 登录状态。提交内容会公开到指定仓库的 Issues。本机脚本使用本机 GitHub CLI 登录；正式接收服务的凭据保存在服务器私有环境中。不要将凭据放进前端代码、任何 `VITE_` 变量或仓库。浏览器端的 `VITE_FEEDBACK_API_URL`（如需设置）只用于接收服务地址，不是密钥。

## 来源与复用

元素、核素、化学内容和教材页码都有对应来源记录。请先阅读 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 了解来源范围、素材区别和复用边界。当前仓库没有项目级许可证；公开仓库本身不授予代码、数据、文字或图片的通用复用许可。
