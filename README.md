# VisualKnowledge

Interactive AI Chat with Visualization — 用可视化方式与 AI 对话，让复杂概念一目了然。

## 功能特性

- **流式对话** — 基于 Claude API 的实时流式响应，打字机效果逐字呈现
- **内联图表渲染** — AI 回复中的 Mermaid 图表、HTML 可视化与文字自然交叉排列，而非堆叠在底部
- **多主题支持** — 深色 / 浅色主题一键切换
- **Markdown 完整支持** — 代码高亮、表格、引用块、列表等
- **一键启动** — `npx visualknowledge` 即用，无需手动克隆或配置环境
- **隐私优先** — 所有数据本地处理，无远程追踪
- **端口自动检测** — 默认端口被占用时自动递增寻找可用端口
- **优雅退出** — Ctrl+C 干净终止所有子进程，无残留

## 快速开始

### 方式一：npx（推荐）

```bash
npx visualknowledge
```

首次运行会自动下载依赖并打开浏览器。之后只需一条命令即可启动。

### 方式二：本地运行

**前置要求：**

- Python 3.10+
- Node.js 16+（仅用于 npx 启动方式）
- Flask、Anthropic SDK（`pip install flask anthropic`）
- 设置环境变量 `ANTHROPIC_API_KEY`

**启动：**

```bash
# 克隆仓库
git clone https://github.com/user/VisualKnowledge.git
cd VisualKnowledge

# 安装 Python 依赖
pip install flask anthropic

# 设置 API Key
export ANTHROPIC_API_KEY=your-key-here

# 启动服务
python server.py
# 或使用 npx 启动脚本
node bin/visualknowledge.js
```

浏览器自动打开 `http://localhost:5000`。

### 命令行选项

| 选项 | 说明 |
|------|------|
| `-p, --port <port>` | 指定起始端口（默认 5000） |
| `--no-open` | 启动后不自动打开浏览器 |
| `-h, --help` | 显示帮助信息 |
| `-v, --version` | 显示版本号 |

```bash
npx visualknowledge -p 8080          # 使用端口 8080
npx visualknowledge --no-open       # 不自动打开浏览器
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | 原生 HTML / CSS / JavaScript（SPA） |
| 后端 | Python Flask + Anthropic SDK |
| 可视化 | Mermaid.js + 自定义 HTML 渲染器 |
| 分发 | npm（Node.js bootstrap 脚本） |
| 数据库 | SQLite（本地存储） |

## 项目结构

```
VisualKnowledge/
├── index.html              # 前端 SPA（聊天界面 + 渲染引擎）
├── server.py               # Flask 后端（API + 流式响应）
├── package.json            # npm 包配置（npx 支持）
├── bin/
│   └── visualknowledge.js  # npx 入口脚本（环境检测 + 进程管理）
├── skills/
│   └── visualize.py        # 可视化技能提示词
└── static/                 # 静态资源
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `ANTHROPIC_API_KEY` | API 密钥 | （必填） |
| `ANTHROPIC_BASE_URL` | API 基础 URL | `https://open.bigmodel.cn/api/anthropic` |
| `ANTHROPIC_MODEL` | 模型名称 | `GLM-5V-Turbo` |

## 未来方向

- [ ] **多模型支持** — 接入 OpenAI、Gemini 等更多 LLM 后端，通过配置切换
- [ ] **对话历史持久化** — 支持多会话管理、搜索历史记录、导出对话
- [ ] **插件系统** — 可扩展的技能/插件架构，用户自定义可视化模板
- [ ] **协作模式** — 多人实时共享画板，同步查看和编辑可视化内容
- [ ] **离线模式** — 本地 LLM（Ollama）集成，完全离线使用
- [ ] **移动端适配** — 响应式布局优化，PWA 支持
- [ ] **更多图表类型** — ECharts/D3.js 集成，支持更丰富的数据可视化
- [ ] **国际化** — 多语言界面支持

## License

MIT
