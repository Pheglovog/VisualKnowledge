# Quickstart: 前端 React 重构

**Feature**: `003-react-rewrite` | **Date**: 2026-04-06

## Prerequisites

- Node.js 16+（用于开发时的本地 HTTP 服务，生产环境由 Flask 提供）
- Python 3.10+ + Flask（后端 API）
- 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）

## Quick Start (3 Steps)

### Step 1: 启动后端

```bash
export ANTHROPIC_API_KEY=your-key-here
python server.py
# 或使用 npx
npx visualknowledge --no-open
```

后端在 `http://localhost:5000` 启动，提供：
- `GET /` → 静态文件服务（前端入口）
- `GET /api/models` → 模型列表
- `POST /api/chat` → SSE 流式对话

### Step 2: 打开浏览器

访问 `http://localhost:5000`

页面加载流程：
1. 加载 index.html（~1KB，仅含 root div + importmap）
2. 并行加载：CSS 文件（8 个）+ CDN 脚本（marked, katex）+ ESM 模块（React, htm）
3. React createRoot → App 组件挂载
4. useModels hook 自动加载模型列表
5. useTheme hook 从 localStorage 恢复主题
6. 就绪，显示欢迎页

### Step 3: 开始对话

输入消息，体验流式响应 + 图表交叉渲染。

## 开发工作流

### 本地开发（热重载）

由于无构建工具，推荐使用 VS Code Live Server 或类似工具：

```bash
# 方案 A: VS Code Live Server 扩展
# 右键 index.html → "Open with Live Server"

# 方案 B: 简单 HTTP 服务（监控文件变化）
npx serve -l 3000 --no-clipboard
# 然后访问 http://localhost:3000
# 注意：API 代理需指向 localhost:5000
```

### 目录导航

```
frontend/
├── src/
│   ├── main.js            # ← 入口从这里开始读
│   ├── App.jsx             # ← 根组件，看整体布局
│   ├── context/
│   │   └── AppContext.jsx  # ← 全局状态定义
│   ├── hooks/
│   │   ├── useChat.js      # ← 核心逻辑：SSE + 流式解析
│   │   ├── useTheme.js     # ← 主题切换
│   │   └── useModels.js    # ← 模型加载
│   ├── components/
│   │   ├── TopBar.jsx      # ← 顶部栏
│   │   ├── ChatArea.jsx    # ← 聊天区域
│   │   ├── Message*.jsx    # ← 消息渲染
│   │   ├── widgets/        # ← 可视化组件
│   │   └── InputArea.jsx   # ← 输入框
│   └── lib/
│       ├── streamProcessor.js  # ← 流式解析器（纯逻辑）
│       ├── markdownRenderer.js # ← Markdown + KaTeX
│       └── mermaidRenderer.js  # ← Mermaid 渲染
└── styles/
    └── *.css              # 样式文件（按组件组织）
```

## 验证清单

### 功能验证

- [ ] 页面加载正常，显示欢迎页
- [ ] 发送消息后出现用户气泡 + AI 开始流式回复
- [ ] AI 回复中的文字实时逐字显示
- [ ] Mermaid 图表在代码块结束后正确渲染并插入到正确位置
- [ ] HTML 可视化在 iframe 中实时预览
- [ ] SVG 可视化正确显示
- [ ] 数学公式（KaTeX）正确渲染
- [ ] 图表与文字交叉排列（非堆叠底部）
- [ ] 点击图表"放大"按钮弹出全屏覆盖层
- [ ] 点击 HTML "全屏"按钮进入全屏模式
- [ ] Escape 键关闭全屏视图
- [ ] 主题切换正常（深色 ↔ 浅色），刷新后保持
- [ ] 模型下拉框正确填充
- [ ] Enter 发送 / Shift+Enter 换行
- [ ] 输入框自动增高（最大 200px）
- [ ] 流式输出中发送按钮禁用

### 视觉回归对比

| 检查项 | 原版 (index.html) | 重构版 (React) |
|--------|-------------------|----------------|
| 整体布局 | 居中 768px 最大宽度 | 一致 |
| 消息气泡样式 | 圆角、颜色、间距 | 一致 |
| 代码块样式 | 背景、边框、字体 | 一致 |
| Widget 容器 | header + body 结构 | 一致 |
| 深色主题配色 | 全部 CSS 变量值 | 一致 |
| 浅色主题配色 | 全部 CSS 变量值 | 一致 |
| 动画效果 | fadeIn、spin、blink | 一致 |

## Troubleshooting

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 页面白屏 | ESM 模块加载失败 | 检查浏览器控制台网络请求，确认 esm.sh 可达 |
| React 报 "useState is not defined" | htm/react 导入路径错误 | 检查 importmap 配置 |
| Mermaid 不渲染 | mermaid ESM 加载时序问题 | 确保 mermaid.initialize() 在首次 render 前完成 |
| 主题切换不生效 | CSS 变量未加载 | 确认 variables.css 在其他样式之前加载 |
| SSE 流不工作 | fetch 被 CORS 拦截 | 确保前端和后端同源（均为 localhost:5000） |
