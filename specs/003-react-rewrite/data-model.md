# Data Model: 前端 React 重构

**Feature**: `003-react-rewrite` | **Date**: 2026-04-06

## Entities

### 1. Message（消息）

代表对话中的一条消息。

| Field | Type | Description |
|-------|------|-------------|
| id | string | 唯一标识符（`msg_${timestamp}_${random}`） |
| role | `'user'` \| `'assistant'` | 消息角色 |
| content | string | 原始纯文本内容（完整累积文本） |
| segments | ContentSegment[] | 解析后的内容段列表（用于渲染） |
| status | `'streaming'` \| `'complete'` \| `'error'` | 当前状态 |
| error | string \| null | 错误信息（仅 status=error 时有值） |
| timestamp | number | 创建时间戳 |

### 2. ContentSegment（内容段）

消息内容的原子渲染单元。

| Field | Type | Description |
|-------|------|-------------|
| id | string | 唯一标识符 |
| type | `'text'` \| `'mermaid'` \| `'html'` \| `'svg'` | 段类型 |
| content | string | 段原始内容（text 为 markdown 文本，mermaid 为图表代码，html 为 HTML 代码，svg 为 SVG 标记） |
| renderedContent | string \| null | 渲染后的 HTML（mermaid→SVG 字符串，text→Markdown HTML） |
| renderStatus | `'pending'` \| `'rendering'` \| `'done'` \| `'error'` | 渲染状态 |
| renderError | string \| null | 渲染错误信息 |

### 3. AppState（全局应用状态）

React Context 管理的单一状态树。

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| messages | Message[] | `[]` | 完整对话历史 |
| isStreaming | boolean | `false` | 是否正在接收 AI 流式响应 |
| currentModel | string | `''` | 当前选中的模型 ID |
| availableModels | string[] | `[]` | 可用模型列表 |
| theme | `'dark'` \| `'light'` | `'dark'` | 当前主题（从 localStorage 读取） |
| fullscreenWidget | FullscreenState \| null | `null` | 全屏查看状态 |

### 4. FullscreenState（全屏状态）

Widget 全屏查看时的覆盖层状态。

| Field | Type | Description |
|-------|------|-------------|
| widgetType | `'mermaid'` \| `'html'` \| `'svg'` | Widget 类型 |
| title | string | 显示标题（如"流程图"、"交互式可视化"） |
| content | string | 全屏展示的内容（HTML/SVG 字符串） |

### 5. StreamProcessorState（流处理器内部状态）

StreamProcessor 类的内部状态机（不暴露给 React State，封装在 useChat hook 内）。

| Field | Type | Description |
|-------|------|-------------|
| phase | `'text'` \| `'codeblock'` | 当前解析阶段 |
| currentLang | `''` \| `'mermaid'` \| `'html'` \| `'svg'` | 当前代码块语言 |
| buffer | string | 当前阶段累积缓冲区 |
| tickCount | number | 反引号计数器（用于检测代码块边界） |
| segments | ContentSegment[] | 已解析完成的段列表 |
| activeTextSegment | string | 当前活跃的文字段内容 |

## State Transitions

### Message Lifecycle

```
                    ┌──────────────┐
     user sends     │              │  SSE stream starts
    ───────────────►│   streaming  │◄─────────────────┐
                    │              │                   │
                    └──────┬───────┘                   │
                           │ stream ends / error       │
              ┌────────────┼────────────┐              │
              ▼            ▼            ▼              │
         ┌─────────┐  ┌────────┐  ┌────────┐          │
         │ complete│  │ error  │  │(append  │──────────┘
         └─────────┘  └────────┘  │ text)  │
                                  └────────┘
```

### StreamProcessor State Machine

```
                    ┌──────────┐  receive ```lang
                    │   text   │──────────────────────┐
                    └────┬─────┘                       │
                         │ receive ``` (close)        │
                         ▼                             │
                    ┌───────────┐                      │
                    │ codeblock  │◄─────────────────────┘
                    └─────┬─────┘
                          │ receive ``` (close)
                          ▼
                       (back to text)
```

每个状态转换产生一个 ContentSegment：
- `text → codeblock`: 输出 `{type:'text', content:buffer}` + 创建新 codeblock segment
- `codeblock → text`: 输出 `{type:lang, content:codeBuffer}` + 重置

## Relationships

```
AppState
├── messages*: Message (1:N)
│   ├── segments*: ContentSegment (1:N)
│   └── status → determines UI behavior
├── isStreaming → controls InputArea & MessageList
├── theme → controls CSS variable on <html>
├── currentModel / availableModels → TopBar model select
└── fullscreenWidget → FullscreenOverlay visibility

Message (assistant) internally uses:
└── StreamProcessor (transient, not in state tree)
    └── produces ContentSegment[]
```
