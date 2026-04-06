# UI Component Contract: 前端 React 重构

**Feature**: `003-react-rewrite` | **Date**: 2026-04-06

## Overview

本文档定义 React 组件间的接口契约。由于本项目是纯前端 SPA（无外部组件消费者），"契约"主要体现为：
1. **Props 接口**：每个组件接收什么数据
2. **Context 消费**：哪些组件直接读取全局状态
3. **Dispatch 调用**：哪些组件触发状态变更
4. **Widget 接口**：可扩展的 Widget 类型协议

---

## Global Context: AppContext

### State Shape

```typescript
interface AppState {
  messages: Message[]
  isStreaming: boolean
  currentModel: string
  availableModels: string[]
  theme: 'dark' | 'light'
  fullscreenWidget: FullscreenState | null
}
```

### Dispatch Actions

```typescript
type AppAction =
  | { type: 'ADD_USER_MESSAGE'; content: string }
  | { type: 'START_ASSISTANT_MESSAGE' }
  | { type: 'APPEND_TO_SEGMENT'; messageId: string; text: string }
  | { type: 'FINALIZE_SEGMENTS'; messageId: string; segments: ContentSegment[] }
  | { type: 'SET_STREAMING_ERROR'; messageId: string; error: string }
  | { type: 'SET_MODELS'; models: string[]; current: string }
  | { type: 'SET_THEME'; theme: 'dark' | 'light' }
  | { type: 'SET_FULLSCREEN_WIDGET'; widget: FullscreenState | null }
```

### Usage Convention

- **Layout 组件**（App, ChatArea, TopBar, InputArea）：通过 `useContext(AppContext)` 读取 state + dispatch
- **展示组件**（Message, TextPart, Widget*）：仅通过 Props 接收数据，不直接访问 Context
- **Hook 层**（useChat, useTheme, useModels）：封装 Context 访问逻辑，提供简洁 API

---

## Component Props Contracts

### Layout Components

#### `TopBar`

| Prop | Type | Description |
|------|------|-------------|
| theme | `'dark' \| 'light'` | 当前主题 |
| onThemeToggle | `() => void` | 切换主题回调 |
| currentModel | `string` | 当前模型 |
| models | `string[]` | 可用模型列表 |
| onModelChange | `(model: string) => void` | 模型切换回调 |

**Context access**: 通过 useModels hook 封装

#### `ChatArea`

| Prop | Type | Description |
|------|------|-------------|
| children | `ReactNode` | 消息列表或欢迎页 |

**Behavior**: 自动滚动到底部（当新消息到达或流式更新时）

#### `InputArea`

| Prop | Type | Description |
|------|------|-------------|
| onSend | `(text: string) => void` | 发送消息回调 |
| disabled | `boolean` | 是否禁用（流式输出中） |

**Internal state**: 输入框文本、自动高度（组件内管理）

---

### Message Components

#### `MessageList`

| Prop | Type | Description |
|------|------|-------------|
| messages | `Message[]` | 完整消息列表 |

**Behavior**: 渲染 Message 列表，空时显示 WelcomeScreen

#### `Message`

| Prop | Type | Description |
|------|------|-------------|
| message | `Message` | 消息数据 |

**Behavior**: 根据 `role` 渲染 UserMessage 或 AssistantMessage

#### `AssistantMessage`

| Prop | Type | Description |
|------|------|-------------|
| message | `Message` | assistant 消息数据 |
| isStreaming | `boolean` | 是否仍在流式输出 |

**Behavior**: 渲染头像 + ContentSegment 列表，streaming 时末尾显示 TypingIndicator

---

### Content Segment Components

#### `TextPart`

| Prop | Type | Description |
|------|------|-------------|
| content | `string` | Markdown 原文 |
| isStreaming | `boolean` | 是否仍在累积中 |

**Behavior**: 调用 markdownRenderer 解析为 HTML，注入 DOM（dangerouslySetInnerHTML），渲染后调用 KaTeX

#### `TypingIndicator`

| Props | 无 | 纯展示组件 |

---

### Widget Components（可扩展接口）

#### WidgetContainer（通用外壳）

| Prop | Type | Description |
|------|------|-------------|
| badge | `string` | 标签文字（如 "diagram"、"visualize"） |
| typeLabel | `string` | 类型描述（如 "流程图"、"交互式可视化"） |
| status | `'loading' \| 'done' \| 'error'` | 渲染状态 |
| children | `ReactNode` | 内容区 |
| onZoom | `() => void` | 放大/全屏回调 |

#### MermaidWidget

| Prop | Type | Description |
|------|------|-------------|
| code | `string` | Mermaid 源代码 |
| onZoom | `(svgContent: string, chartType: string) => void` | 放大回调 |

**Lifecycle**:
1. Mount → 显示 loading spinner
2. Effect → 调用 mermaidRenderer.render(code)
3. Success → 注入 SVG 到 body
4. Error → 显示错误信息

#### HtmlWidget

| Prop | Type | Description |
|------|------|-------------|
| html | `string` | HTML 源代码 |
| onFullscreen | `(html: string) => void` | 全屏回调 |

**Lifecycle**:
1. Mount → 创建 iframe (src="about:blank")
2. iframe load → 写入 html
3. Streaming → 追加 chunk 时重新 write
4. Finalize → 调整 iframe 高度

#### SvgWidget

| Prop | Type | Description |
|------|------|-------------|
| svg | `string` | SVG 标记字符串 |
| onZoom | `(svgContent: string) => void` | 放大回调 |

**Lifecycle**: 类似 MermaidWidget 但无需异步解析

#### FullscreenOverlay

| Prop | Type | Description |
|------|------|-------------|
| widget | `FullscreenState \| null` | 全屏状态（null 时隐藏） |
| onClose | `() => void` | 关闭回调 |

---

## Widget Extension Protocol

添加新的 Widget 类型需遵循以下步骤：

1. **在 StreamProcessor 中注册新语言检测** — 在 `detectBlockStart()` 的语言列表中添加新标签
2. **创建新 Widget 组件** — 实现 WidgetContainer 的 children slot
3. **在 AssistantMessage 中添加渲染分支** — 根据 segment.type 分发到对应组件
4. **（可选）在 FullscreenOverlay 中添加支持**

**涉及的文件数**：3-4 个（符合 SC-003 标准）

---

## Hook Contracts

### `useChat(): UseChatReturn`

核心对话 Hook，封装 SSE 连接和 StreamProcessor。

```typescript
interface UseChatReturn {
  messages: Message[]
  isStreaming: boolean
  sendMessage: (text: string) => Promise<void>
}
```

**内部行为**:
1. `sendMessage()` → dispatch ADD_USER_MESSAGE → dispatch START_ASSISTANT_MESSAGE
2. 创建 StreamProcessor 实例
3. 发起 fetch POST /api/chat
4. reader.read() 循环 → decoder → parser → StreamProcessor.feed()
5. 每次 feed 后 getSegments() → dispatch FINALIZE_SEGMENTS（节流）
6. 流结束 → finalize() → 最终 dispatch
7. 错误处理 → dispatch SET_STREAMING_ERROR

### `useTheme(): UseThemeReturn`

```typescript
interface UseThemeReturn {
  theme: 'dark' | 'light'
  toggleTheme: () => void
}
```

**内部行为**: 读写 localStorage('claude-chat-theme') + 设置 document.documentElement.dataset.theme

### `useModels(): UseModelsReturn`

```typescript
interface UseModelsReturn {
  currentModel: string
  models: string[]
  setModel: (model: string) => void
  isLoading: boolean
}
```

**内部行为**: GET /api/models → dispatch SET_MODELS
