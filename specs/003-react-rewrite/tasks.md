# Tasks: 前端 React 重构

**Input**: Design documents from `/specs/003-react-rewrite/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/ui-contract.md

**Tests**: 未在规格说明中显式请求测试任务，本任务列表聚焦实现。

**Organization**: 任务按用户故事分组，每个故事可独立实现和验证。Phase 1-2 为所有故事的前置依赖。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3, US4）
- 描述中包含精确文件路径

## Phase 1: Setup（项目结构与静态资源）

**Purpose**: 创建 frontend/ 目录结构，提取 CSS，创建入口 HTML

- [x] T001 创建 `frontend/` 目录结构：`frontend/src/{components,context,hooks,lib,utils}`, `frontend/src/components/widgets/`, `frontend/styles/`
- [x] T002 从 `index.html` 提取 CSS 为 8 个独立文件到 `frontend/styles/`：variables.css、base.css、top-bar.css、chat-area.css、message.css、markdown.css、widget.css、input-area.css，保持所有选择器和变量名不变
- [x] T003 创建 `frontend/index.html` 入口文件：包含 `<div id="root">`、ESM importmap（react@18, react-dom/client, htm）、CDN script 标签（marked, katex css+js, mermaid ESM）、8 个 CSS `<link>` 引用、`<script type="module" src="./src/main.js">`
- [x] T004 [P] 创建 `frontend/src/utils/escape.js`：导出 `escapeHtml(str)` 函数（从原代码第 443-445 行迁移）

---

## Phase 2: Foundational（基础设施 — 所有用户故事的阻塞前置）

**Purpose**: 实现纯逻辑层、React Context、入口挂载。此阶段完成前无法开始任何 UI 组件。

⚠️ **关键**: 此阶段完成前无法开始任何用户故事

- [x] T005 实现 `frontend/src/lib/streamProcessor.js`：StreamProcessor 类，包含构造函数、`feed(chunk)` 方法（字符级状态机：text ↔ codeblock 检测 ```mermaid/```html/```svg）、`getSegments()` 返回 ContentSegment[]、`finalize()` 结束流式解析、`reset()` 重置状态机。完全无 DOM 依赖
- [x] T006 实现 `frontend/src/lib/markdownRenderer.js`：导出 `renderMarkdown(text)` 函数（迁移原 renderMarkdown + renderMath 逻辑），处理 [VISUALIZE:] 标签移除、mermaid/html/svg 代码块过滤、marked.parse + katex 渲染
- [x] T007 实现 `frontend/src/lib/mermaidRenderer.js`：导出 `initMermaid(isLight)` 和 `renderMermaid(code)` 函数（迁移原 mermaid 初始化配置 + 渲染逻辑），封装 dark/light 两套主题配置
- [x] T008 [P] 实现 `frontend/src/context/AppContext.jsx`：定义 AppState 类型、AppAction 联合类型（ADD_USER_MESSAGE, START_ASSISTANT_MESSAGE, APPEND_TO_SEGMENT, FINALIZE_SEGMENTS, SET_STREAMING_ERROR, SET_MODELS, SET_THEME, SET_FULLSCREEN_WIDGET）、appReducer 纯函数、初始状态、AppContext Provider 创建 + useContext 导出
- [x] T009 实现 `frontend/src/main.js`：导入 React/ReactDOM/client、导入 App 组件、`ReactDOM.createRoot(document.getElementById('root')).render(<App />)`

**Checkpoint**: 基础设施就绪 — 用户故事实现可以开始

---

## Phase 3: User Story 1 - 核心对话体验 (Priority: P1) 🎯 MVP

**Goal**: 用户发送消息后看到流式 AI 回复，文字与图表交叉排列渲染

**Independent Test**: 启动应用 → 发送消息 → 验证流式文字输出 + Mermaid 图表正确插入位置 + 文字继续显示

### Layout & Message Components

- [x] T010 [US1] 实现 `frontend/src/App.jsx`：根组件，使用 AppContext，布局编排 TopBar + ChatArea(MessageList/WelcomeScreen) + InputArea + FullscreenOverlay，传入各自需要的 context 数据和回调
- [x] T011 [US1] 实现 `frontend/src/components/ChatArea.jsx`：滚动容器组件，props 接收 children，使用 useRef + useEffect 实现自动滚动到底部（监听 messages 变化或 isStreaming 变化时 scrollToBottom）
- [x] T012 [US1] 实现 `frontend/src/components/WelcomeScreen.jsx`：空状态欢迎页，展示 logo 图标、"有什么可以帮你的？"标题、副标题文字，纯展示组件
- [x] T013 [US1] 实现 `frontend/src/components/MessageList.jsx`：接收 messages 数组 prop，为空时渲染 WelcomeScreen，否则遍历渲染 Message 组件列表
- [x] T014 [US1] 实现 `frontend/src/components/Message.jsx`：接收 message 对象 prop，根据 role 分发渲染 UserMessage 或 AssistantMessage
- [x] T015 [US1] 实现 `frontend/src/components/UserMessage.jsx`：接收 content 字符串 prop，渲染右侧气泡（复用原 .message.user .bubble 样式），内容经 escapeHtml 处理
- [x] T016 [US1] 实现 `frontend/src/components/AssistantMessage.jsx`：接收 message 对象 + isStreaming boolean props，渲染头像 + 遍历 message.segments 渲染对应组件（TextPart / MermaidWidget / HtmlWidget / SvgWidget），streaming 时末尾追加 TypingIndicator

### Content Rendering Components

- [x] T017 [US1] 实现 `frontend/src/components/TextPart.jsx`：接收 content(string) + isStreaming(boolean) props，调用 markdownRenderer.renderMarkdown(content) 生成 HTML，使用 dangerouslySetInnerHTML 注入，useEffect 中触发 KaTeX 重新渲染（处理动态内容）
- [x] T018 [US1] 实现 `frontend/src/components/TypingIndicator.jsx`：三点跳动动画组件（复用原 .typing-indicator 样式），纯展示无 props

### Core Hook: useChat

- [x] T019 [US1] 实现 `frontend/src/hooks/useChat.js`：核心对话 Hook，内部管理 StreamProcessor 实例。`sendMessage(text)` 方法：① dispatch ADD_USER_MESSAGE ② dispatch START_ASSISTANT_MESSAGE（生成新 message with id）③ fetch POST /api/chat（body: {messages, model}）④ reader.read() 循环解析 SSE data 行 ⑤ 每个 text event 调用 streamProcessor.feed() ⑥ 节流 dispatch FINALIZE_SEGMENTS（更新 segments）⑦ 流结束调用 finalize() ⑧ 最终 dispatch 更新完整 content 和 status ⑨ 错误处理 dispatch SET_STREAMING_ERROR。返回 `{ messages, isStreaming, sendMessage }`

**Checkpoint**: User Story 1 完成 — 可以发送消息并看到完整流式回复（含文字渲染）

---

## Phase 4: User Story 2 - 界面交互与主题切换 (Priority: P1)

**Goal**: 主题切换、模型选择、输入框交互全部正常工作

**Independent Test**: 切换主题验证颜色变化；选模型后发消息；Enter/Shift+Enter；输入框自适应高度

- [x] T020 [US1][US2] 实现 `frontend/src/hooks/useTheme.js`：读取 localStorage('claude-chat-theme') 初始化 theme，toggleTheme() 切换 dark/light 并写入 localStorage + 设置 document.documentElement.dataset.theme，返回 `{ theme, toggleTheme }`
- [x] T021 [US1][US2] 实现 `frontend/src/hooks/useModels.js`：useEffect 中 fetch GET /api/models，解析响应 dispatch SET_MODELS，返回 `{ currentModel, models, setModel, isLoading }`
- [x] T022 [US2] 实现 `frontend/src/components/TopBar.jsx`：接收 theme/onThemeToggle/currentModel/models/onModelChange props，渲染 Logo + "Claude Chat" 标题 + 主题切换按钮（sun/moon icon 切换）+ 模型选择 `<select>` 下拉框
- [x] T023 [US2] 实现 `frontend/src/components/InputArea.jsx`：接收 onSend(callback)/disabled(boolean) props，内部管理 textarea value state + autoResize 逻辑（max-height 200px）、发送按钮（有内容时高亮）、Enter 发送 / Shift+Enter 换行键盘事件

**Checkpoint**: User Story 2 完成 — 所有界面交互功能可用

---

## Phase 5: User Story 3 - 图表交互功能 (Priority: P2)

**Goal**: Widget 组件可放大/全屏查看，Escape 关闭

**Independent Test**: 触发含图表对话 → 点击放大/全屏 → 验证覆盖层 → Escape 关闭

### Widget Infrastructure

- [x] T024 [US3] 实现 `frontend/src/components/widgets/WidgetContainer.jsx`：通用 Widget 外壳组件，接收 badge/typeLabel/status/children/onZoom props，渲染 header 区域（badge 标签 + typeLabel 描述 + 放大按钮）+ body 区域（children）+ loading/error 状态指示器
- [x] T025 [US3] 实现 `frontend/src/components/widgets/FullscreenOverlay.jsx`：全屏覆盖层组件，接收 widget(FullscreenState|null) + onClose props，null 时 display:none，否则渲染 header（title + 关闭按钮）+ 内容区（dangerouslySetInnerHTML 注入 SVG/HTML）+ 全局 Escape 键监听关闭

### Widget Types

- [x] T026 [US3] 实现 `frontend/src/components/widgets/MermaidWidget.jsx`：接收 code(string) + onZoom(callback) props，useEffect 中异步调用 mermaidRenderer.renderMermaid(code)，loading 状态显示 spinner，成功注入 SVG 到 body，错误显示 widget-error。根据 code 首行判断图表类型（getChartType 逻辑）。点击 zoom 按钮调用 onZoom(svgContent, chartType)
- [x] T027 [US3] 实现 `frontend/src/components/widgets/HtmlWidget.jsx`：接收 html(string) + onFullscreen(callback) props，创建 sandboxed iframe（allow-scripts allow-same-origin），iframe load 后写入 html 内容。支持实时预览：通过 ref 追踪 html 变化定时重新 write。finalize 时调整 iframe 高度（取 body.scrollHeight）。点击 fullscreen 按钮调用 onFullscreen(html)
- [x] T028 [US3] 实现 `frontend/src/components/widgets/SvgWidget.jsx`：接收 svg(string) + onZoom(callback) props，从 svgBuffer 中 _extractSvg 提取完整 <svg>...</svg> 标签（迁移原 LiveSvgWidget._extractSvg 逻辑），注入到 body，设置 maxWidth:100% height:auto。点击 zoom 调用 onZoom(svgContent)

### Wire Widgets into AssistantMessage

- [x] T029 [US3] 更新 `frontend/src/components/AssistantMessage.jsx`：在 segment 渲染分支中接入 Widget 组件——type:'text'→TextPart，type:'mermaid'→MermaidWidget(包 WidgetContainer)，type:'html'→HtmlWidget(包 WidgetContainer)，type:'svg'→SvgWidget(包 WidgetContainer)。将 onZoom/onFullscreen 回调连接到 FullscreenOverlay 的 dispatch SET_FULLSCREEN_WIDGET

**Checkpoint**: User Story 3 完成 — 所有 Widget 可交互（放大/全屏/Escape 关闭）

---

## Phase 6: User Story 4 - 开发者体验提升 (Priority: P2)

**Goal**: 清晰的文件结构，每个组件职责单一

**Independent Test**: 查看目录结构能在 30 秒内定位任意功能

- [x] T030 [US4] 验证文件结构完整性：确认 plan.md 中定义的全部 ~25 个文件已创建，每个文件只包含其命名对应的职责代码
- [x] T031 [US4] 代码质量检查：逐文件审查确保无单个文件超过 200 行（不含样式/注释/空行），无循环依赖，Props 接口与 contracts/ui-contract.md 一致

---

## Phase 7: Polish & Integration（收尾）

**Purpose**: 连接后端、视觉回归验证、清理旧文件

- [x] T032 更新 `server.py` 的静态文件路径：将 `send_from_directory(BASE_DIR, 'index.html')` 改为 `send_from_directory(os.path.join(BASE_DIR, 'frontend'), 'index.html')`，使 Flask 服务新的 frontend/index.html
- [x] T033 [P] 更新 `bin/visualknowledge.js`：如脚本中有硬编码的 index.html 路径引用则同步更新（通常不需要改动，因为由 server.py 处理）
- [ ] T034 视觉回归测试：启动完整服务（python server.py），对比重构前后截图或逐项验证 quickstart.md 验证清单中的 17 项功能点
- [x] T035 将旧的 `index.html` 重命名为 `index.html.legacy` 作为参考备份（不删除，待验证稳定后再清理）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 — 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 — **阻塞所有用户故事**
- **US1 Core Chat (Phase 3)**: 依赖 Foundational — **MVP 核心**
- **US2 Interactions (Phase 4)**: 依赖 Foundational + T010(App) — 可与 US1 的消息组件部分并行
- **US3 Widgets (Phase 5)**: 依赖 US1 的 AssistantMessage(T016) + TextPart(T017) — 在核心渲染完成后增强
- **US4 DevEx (Phase 6)**: 依赖所有组件完成 — 最终验证
- **Polish (Phase 7)**: 依赖全部用户故事完成

### User Story Dependencies

- **US1 (P1)**: Foundational 完成后即可开始 — 不依赖其他用户故事
- **US2 (P1)**: 依赖 Foundational + App 组件骨架 — Hooks 层可与 US1 的组件层并行开发
- **US3 (P2)**: 依赖 US1 的 AssistantMessage 和 TextPart（Widget 需要嵌入其中）
- **US4 (P2)**: 依赖所有代码编写完成（验证性任务）

### Within Each User Story

- lib/ 工具函数必须在 hooks/ 之前（hooks 依赖 lib）
- Context 必须在消费 Context 的组件之前
- main.js 必须在最后（依赖 App 组件）
- Widget 组件可在 AssistantMessage 接入前独立开发和测试

### Parallel Opportunities

- T002(CSS提取) 与 T001(目录创建) 之后的所有任务可部分并行
- T005/T006/T007（三个 lib 文件）是完全独立的纯函数，可并行编写
- T008(Context) 与 T009(main.js) 有轻微依赖（main import App），但 App 可先写骨架
- T022(TopBar) 与 T023(InputArea) 是不同组件，可并行
- T026/T027/T028（三种 Widget）是独立组件，可并行
- T030/T031（验证任务）可与 T35 并行

---

## Task Summary

| Phase | Tasks | Key Output |
|-------|-------|------------|
| Phase 1: Setup | T001-T004 | 目录结构 + CSS 文件 + index.html + escape 工具 |
| Phase 2: Foundational | T005-T009 | StreamProcessor + markdownRenderer + mermaidRenderer + Context + main.js |
| Phase 3: US1 MVP | T010-T019 | App + 布局组件 + 消息组件 + TextPart + **useChat 核心 Hook** |
| Phase 4: US2 | T020-T023 | useTheme + useModels + TopBar + InputArea |
| Phase 5: US3 | T024-T029 | WidgetContainer + 3 种 Widget + FullscreenOverlay + 接入 |
| Phase 6: US4 | T030-T031 | 结构验证 + 代码质量 |
| Phase 7: Polish | T032-T035 | server.py 路径更新 + 回归测试 + 旧文件归档 |
| **总计** | **35** | |

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3（18 个任务）**

这是最小可交付单元：用户可以打开页面、看到 UI、发送消息、收到流式文字回复。US2（主题/输入框）和 US3（Widget 交互）是体验增强。

### Next MVP = + Phase 4（4 个任务）= 22 个任务

加入主题切换和完整输入交互后达到"完整可用"状态。

### Full = + Phase 5 + 6 + 7（13 个任务）= 35 个任务

全部完成后的最终交付。

---

## Notes

- [P] 任务 = 不同文件或独立模块，无互相依赖
- [Story] 标签将任务映射到具体用户故事以便追溯
- T019（useChat）是最关键的任务——它是整个应用的数据中枢
- T005（StreamProcessor）是最复杂的单文件——需精确迁移字符级状态机逻辑
- 所有组件使用 htm 标签模板（非 JSX），语法为 html`<div className="foo">${children}</div>`
