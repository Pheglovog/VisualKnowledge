# Research: 前端 React 重构

**Feature**: `003-react-rewrite` | **Date**: 2026-04-06

## R1: React 无构建工具加载方案

### 决策：使用 ESM CDN（esm.sh）+ importmap 加载 React 及其生态

### 候选方案评估

| 方案 | 优点 | 缺点 |
|------|------|------|
| **A. React UMD CDN**（cdnjs/unpkg） | 简单直接，全局变量 `React`/`ReactDOM` | 无法使用 JSX Hooks 等现代语法；需用 `React.createElement` 或 Babel standalone（重） |
| **B. ESM CDN + importmap**（esm.sh / esm.run） | 支持完整现代语法（JSX via htm/preact 或 babel-standalone）；按需加载；tree-shaking capable | 首次加载需解析模块依赖图；离线不可用 |
| **C. Preact + htm**（轻量替代） | 仅 ~4KB（vs React 45KB）；htm 标签模板无需编译；信号系统内置 | API 与 React 有差异；生态兼容性需适配层 |
| **D. Babel Standalone 浏览器编译** | 支持完整 JSX 语法 | 编译开销大（~2MB），显著影响首屏性能 |

### 选择：方案 B — ESM CDN（esm.sh）+ htm 标签模板

**理由**：
1. **零构建步骤**：符合 FR-007 和 FR-008，用户访问即用
2. **现代语法支持**：使用 `htm` 作为 JSX 替代（标签模板字面量），无需编译器
3. **完整 React 语义**：Hooks、Context、useEffect、useRef、useCallback 全部可用
4. **合理体积**：React core (~6KB gzip) + ReactDOM (~40KB gzip) + htm (~1KB gzip) ≈ 47KB，可接受
5. **CDN 缓存**：esm.sh 提供 HTTP 缓存头，重复访问几乎零开销

### 技术细节

```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
    "htm": "https://esm.sh/htm@3.1.1"
  }
}
</script>
```

组件中使用 `html` 标签模板：
```javascript
import { html } from 'htm/react';
// 用法：html`<div className="foo">${children}</div>`
```

---

## R2: 状态管理策略

### 决策：React Context + useReducer（单 Store 模式）

### 候选方案评估

| 方案 | 适用场景 | 本项目适用性 |
|------|----------|-------------|
| **A. useState 组件内状态** | 简单组件本地状态 | 不够——流式渲染涉及跨组件协调（消息列表 ↔ 输入框 ↔ 流处理器） |
| **B. Context + useReducer** | 中等复杂度 SPA | **最佳匹配**——单一数据源，dispatch 驱动，适合 SSE 流式更新模式 |
| **C. Zustand/Jotai** | 复杂状态管理 | 过重——需要额外 npm 依赖，违反 FR-007 |
| **D. Redux** | 大型应用 | 过重——boilerplate 多，本项目不需要 |

### 选择：方案 B — Context + useReducer

**State 结构设计**：

```javascript
{
  messages: Message[],          // 完整对话历史
  isStreaming: boolean,         // 是否正在接收流式响应
  currentModel: string,         // 当前选中模型
  availableModels: string[],    // 可用模型列表
  theme: 'dark' | 'light',      // 当前主题
  fullscreenWidget: Widget | null, // 全屏查看中的 widget
}
```

**Action 类型**：

```javascript
// 消息相关
{ type: 'ADD_USER_MESSAGE', content: string }
{ type: 'START_ASSISTANT_MESSAGE' }
{ type: 'APPEND_TEXT', messageId: string, text: string }
{ type: 'INSERT_SEGMENT', messageId: string, segment: ContentSegment }
{ type: 'FINALIZE_MESSAGE', messageId: string, fullText: string }
{ type: 'SET_STREAMING_ERROR', messageId: string, error: string }

// UI 相关
{ type: 'SET_MODELS', models: string[], current: string }
{ type: 'SET_THEME', theme: string }
{ type: 'SET_FULLSCREEN_WIDGET', widget: Widget | null }
```

---

## R3: CSS 架构策略

### 决策：保留现有 CSS 变量主题系统，迁移为独立 CSS 文件

### 分析

当前 CSS（~310 行）已经基于 CSS 变量实现了完善的双主题系统。重构的关键是：
1. 将内联 `<style>` 提取为独立 `.css` 文件
2. 保持所有 `--var-*` 变量名不变（确保视觉一致性）
3. 组件样式通过 CSS 类名组织（不使用 CSS-in-JS，避免运行时开销）

### 文件拆分计划

| 文件 | 内容 | 行数估计 |
|------|------|----------|
| `styles/variables.css` | CSS 变量定义（深色 + 浅色两套） | ~80 |
| `styles/base.css` | Reset、body、布局骨架 | ~30 |
| `styles/top-bar.css` | 顶部导航栏样式 | ~25 |
| `styles/chat-area.css` | 聊天区域、滚动条 | ~20 |
| `styles/message.css` | 用户/AI 消息气泡、头像 | ~60 |
| `styles/markdown.css` | Markdown 渲染样式（代码块、表格、引用等） | ~80 |
| `styles/widget.css` | 图表容器、全屏覆盖层 | ~70 |
| `styles/input-area.css` | 输入框、发送按钮 | ~25 |

---

## R4: 流式渲染架构解耦

### 决策：StreamProcessor 纯函数层 + React 渲染层分离

### 核心问题

当前代码中 `processNewText()` 函数同时负责：
1. 字符级状态机解析（检测 ```mermaid、```html 等）
2. DOM 操作（创建 textPart、插入 widget 容器）
3. 触发 Markdown 重新渲染
4. 触发 Mermaid/SVG/HTML Widget 的增量更新

这四项职责必须解耦。

### 新架构设计

```
┌─────────────────────────────────────────────┐
│              StreamProcessor                 │
│  (纯函数，无 DOM 依赖)                        │
│                                             │
│  Input:  accumulatedText + newChunk          │
│  Output: { segments: ContentSegment[] }       │
│                                             │
│  内部状态机:                                 │
│  text → detect_block_start → codeblock       │
│  codeblock → detect_block_end → text         │
│                                             │
│  每个 segment 包含:                          │
│  { type: 'text', content: string }           │
│  { type: 'mermaid', code: string }           │
│  { type: 'html', html: string }             │
│  { type: 'svg', svg: string }               │
└──────────────────┬──────────────────────────┘
                   │ dispatch segments
                   ▼
┌─────────────────────────────────────────────┐
│            React Components                  │
│                                             │
│  <MessageList> → <Message> → <ContentSegment[]> │
│                                       │      │
│                              ┌────────┤      │
│                              ▼        ▼      ▼
│                         <TextPart> <MermaidWidget>
│                                           <HtmlWidget>
│                                            <SvgWidget>
└─────────────────────────────────────────────┘
```

**StreamProcessor 接口**：

```javascript
class StreamProcessor {
  constructor()
  feed(chunk: string): void              // 输入新文本块
  getSegments(): ContentSegment[]         // 获取当前所有已解析段
  finalize(): ContentSegment[]            // 结束流，返回最终段列表
  reset(): void                           // 重置状态机（用于下一条消息）
}
```

---

## R5: 组件边界与文件结构

### 决策：功能模块化目录结构

### 目标文件树

```
frontend/
├── index.html                    # 入口 HTML（仅含 root div + script type=module）
├── styles/
│   ├── variables.css             # CSS 变量 & 主题定义
│   ├── base.css                  # Reset & layout
│   ├── top-bar.css               # 顶部栏
│   ├── chat-area.css             # 聊天区域
│   ├── message.css               # 消息气泡
│   ├── markdown.css              # Markdown 渲染
│   ├── widget.css                # Widget 容器 & 全屏
│   └── input-area.css            # 输入区域
├── src/
│   ├── App.jsx                   # 根组件（布局编排）
│   ├── main.js                   # 入口（ReactDOM.createRoot）
│   ├── context/
│   │   └── AppContext.jsx        # React Context + useReducer
│   ├── hooks/
│   │   ├── useChat.js            # 对话核心 Hook（SSE 连接 + StreamProcessor）
│   │   ├── useTheme.js           # 主题切换 Hook
│   │   └── useModels.js          # 模型加载 Hook
│   ├── components/
│   │   ├── TopBar.jsx            # 顶部导航（logo + 主题切换 + 模型选择）
│   │   ├── ChatArea.jsx          # 聊天区域容器（滚动 + 自动到底部）
│   │   ├── WelcomeScreen.jsx     # 欢迎页（空状态）
│   │   ├── MessageList.jsx       # 消息列表
│   │   ├── Message.jsx           # 单条消息（user/assistant）
│   │   ├── UserMessage.jsx       # 用户消息气泡
│   │   ├── AssistantMessage.jsx  # AI 消息（avatar + 内容区）
│   │   ├── TextPart.jsx          # 文本段落（Markdown + KaTeX 渲染）
│   │   ├── TypingIndicator.jsx   # 打字动画指示器
│   │   ├── widgets/
│   │   │   ├── WidgetContainer.jsx   # Widget 外壳（header + body + loading）
│   │   │   ├── MermaidWidget.jsx     # Mermaid 图表渲染
│   │   │   ├── HtmlWidget.jsx        # HTML iframe 可视化
│   │   │   ├── SvgWidget.jsx         # SVG 可视化
│   │   │   └── FullscreenOverlay.jsx # 全屏覆盖层
│   │   └── InputArea.jsx         # 输入区域（textarea + 发送按钮）
│   ├── lib/
│   │   ├── streamProcessor.js    # 流式文本解析器（纯函数/类）
│   │   ├── markdownRenderer.js   # Markdown + KaTeX 渲染封装
│   │   └── mermaidRenderer.js    # Mermaid 初始化与渲染封装
│   └── utils/
│       └── escape.js            # HTML 转义工具
```

---

## R6: 外部依赖处理

### 决策：保持 CDN 加载方式，统一在 index.html 中声明

### 依赖清单

| 库 | 当前加载方式 | 重构后 | 用途 |
|----|-------------|--------|------|
| marked | CDN `<script>` | CDN `<script>`（全局） | Markdown → HTML |
| mermaid | ESM `import` | ESM `import`（保留） | 图表渲染 |
| katex | CDN `<script>` + `<link>` | CDN `<script>` + `<link>`（保留） | 数学公式 |
| react | — | ESM `importmap` + esm.sh | UI 框架 |
| react-dom | — | ESM `importmap` + esm.sh | DOM 渲染 |
| htm | — | ESM `importmap` + esm.sh | JSX 替代（标签模板） |

**注意**：marked 和 katex 不是 ESM 模块友好（或全局使用更方便），继续以传统 `<script>` 方式加载。React 生态通过 ESM importmap 加载。
