# Feature Specification: 前端 React 重构

**Feature Branch**: `003-react-rewrite`
**Created**: 2026-04-06
**Status**: Draft
**Input**: User description: "目前的前端使用react重写吧，我觉得有点太乱了，用框架来写吧"

## Background & Motivation

当前前端全部代码集中在单个 `index.html` 文件中（约 1050 行），包含内联 CSS（~310 行）、HTML 结构和 JavaScript（~690 行）。随着功能增长，代码已出现以下问题：

- **无组件化**：所有 UI 元素（消息列表、输入框、图表组件、主题切换等）混在一个文件中
- **状态管理混乱**：全局变量散落各处（`conversationHistory`, `isStreaming`, `blockState` 等），流式渲染的状态机逻辑与 DOM 操作深度耦合
- **难以维护**：新增功能需在已有大段代码中插入，修改一处易影响其他部分
- **无法复用**：Widget 组件（Mermaid 图表、HTML 可视化、SVG 可视化）虽然已封装为类，但与父级渲染流程紧耦合

**目标**：使用现代前端框架重构，实现组件化、状态集中管理、可维护性显著提升，同时保持所有现有功能不变。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 核心对话体验完整保留 (Priority: P1)

用户打开应用后，看到与当前版本完全一致的聊天界面。可以输入消息、接收 AI 的流式回复（含文字、Mermaid 图表、HTML/SVG 可视化），图示与文字交叉排列显示。

**Why this priority**: 这是对用户价值最高的核心功能，是产品存在的根本理由。重构的首要目标是"换引擎不换体验"。

**Independent Test**: 启动应用后完成一轮完整对话，验证：消息发送 → 流式文字输出 → 图表/可视化渲染 → 文字继续输出，全程视觉表现与重构前一致。

**Acceptance Scenarios**:

1. **Given** 用户已打开应用, **When** 在输入框输入文字并发送, **Then** 消息气泡出现在右侧，AI 开始以流式方式逐字回复
2. **Given** AI 正在流式输出包含 Mermaid 代码块的回复, **When** 代码块开始传输, **Then** 图表容器立即插入到对应位置（而非堆在底部），图表渲染完成后文字继续在其下方显示
3. **Given** AI 正在流式输出包含 HTML 可视化的回复, **When** HTML 代码块传输, **Then** iframe 容器实时预览 HTML 内容，最终完成后可点击全屏查看
4. **Given** AI 回复包含数学公式 ($...$ 或 $$...$$), **When** 公式所在文本段渲染完成, **Then** KaTeX 正确渲染为数学符号

---

### User Story 2 - 界面交互与主题切换 (Priority: P1)

用户可以切换深色/浅色主题，选择模型，使用快捷键发送消息，输入框自动调整高度。所有交互行为与当前版本一致。

**Why this priority**: 与 US1 同为 P1——主题和基础交互是用户体验的基础层，必须在 MVP 中完整保留。

**Independent Test**: 切换主题后验证所有元素颜色正确变化；选择不同模型后发送消息确认生效；测试 Enter 发送 / Shift+Enter 换行。

**Acceptance Scenarios**:

1. **Given** 应用处于默认深色主题, **When** 点击主题切换按钮, **Then** 整个界面切换为浅色主题，且主题偏好被保存到本地存储，刷新后仍为浅色
2. **Given** 页面加载完成, **When** API 返回可用模型列表, **Then** 模型下拉框正确填充选项并选中当前模型
3. **Given** 输入框中有多行文字, **When** 用户按 Enter 键, **Then** 消息被发送；按 Shift+Enter 则在输入框内换行
4. **Given** 输入框内容超过一行, **When** 用户持续输入, **Then** 输入框自动增高（最大 200px），发送后恢复单行

---

### User Story 3 - 图表交互功能 (Priority: P2)

用户可以放大查看 Mermaid 图表和 SVG 可视化，可以全屏查看 HTML 交互式内容，按 Escape 关闭全屏视图。

**Why this priority**: 这是增强型功能，不影响核心对话流程，但显著提升使用体验。

**Independent Test**: 触发一个包含图表的对话，点击放大按钮验证弹窗展示；触发 HTML 可视化，点击全屏按钮验证 iframe 全屏模式；按 Escape 验证关闭。

**Acceptance Scenarios**:

1. **Given** 消息中包含已渲染的 Mermaid 图表, **When** 点击图表容器的"放大"按钮, **Then** 图表以覆盖层形式全屏展示，有关闭按钮
2. **Given** 消息中包含 HTML 交互式可视化, **When** 点击"全屏"按钮, **Then** 可视化内容以 iframe 全屏模式展示
3. **Given** 处于全屏查看状态, **When** 按 Escape 键或点击关闭按钮, **Then** 全屏视图关闭，回到正常聊天界面

---

### User Story 4 - 开发者体验提升 (Priority: P2)

开发者可以在清晰的文件结构中定位和修改任何功能组件。每个组件职责单一，状态流向清晰可追踪。

**Why this priority**: 这是本次重构的核心目的——提升代码可维护性。对终端用户不可见，但对项目长期健康至关重要。

**Independent Test**: 开发者查看源码目录结构，能在 30 秒内找到任意功能的实现位置（如"主题切换在哪"、"消息渲染逻辑在哪"、"SSE 流处理在哪"）。

**Acceptance Scenarios**:

1. **Given** 开发者打开项目前端目录, **When** 查看文件结构, **Then** 能清楚识别每个主要 UI 区域对应的组件文件
2. **Given** 开发者需要修改消息渲染逻辑, **When** 打开对应组件文件, **Then** 只看到与消息渲染相关的代码，不混杂其他功能
3. **Given** 开发者需要添加新的 Widget 类型, **When** 查看现有 Widget 实现, **Then** 能基于统一的接口/模式快速扩展

---

### Edge Cases

- 当网络中断导致 SSE 流中途断开时，已接收的内容应保留显示，界面应提示连接错误
- 当 AI 回复为空或仅包含 [VISUALIZE] 标签时，不应显示空白消息
- 当连续快速发送多条消息时，每条消息的流式响应应独立处理不互相干扰
- 当浏览器窗口尺寸变化时，布局应自适应（特别是 iframe 高度动态调整）
- 当 Mermaid 图表语法错误时，应在图表区域显示友好的错误信息而非崩溃

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 完整保留现有全部可见功能：流式聊天、Markdown 渲染、KaTeX 数学公式、Mermaid 图表、HTML/SVG 可视化、深浅主题切换、模型选择、快捷键操作
- **FR-002**: 系统 MUST 保持现有的服务端 API 接口不变（`POST /api/chat` SSE 流、`GET /api/models`），重构仅涉及前端
- **FR-003**: 系统 MUST 将单一 `index.html` 拆分为多个独立组件，每个组件对应一个明确的 UI 区域或功能模块
- **FR-004**: 系统 MUST 将流式渲染的状态机逻辑（文字段累积、代码块检测、Widget 插入时机）封装为独立的数据处理层，与 UI 渲染解耦
- **FR-005**: 系统 MUST 支持图示与文字的交叉排列渲染（即：文字段落 → 图表 → 文字段落 → 图表...），这是核心差异化体验
- **FR-006**: 系统 MUST 保持主题系统基于 CSS 变量的实现方式，支持深色/浅色两套完整配色方案
- **FR-007**: 系统 MUST 保持所有外部依赖通过 CDN 加载的方式（marked、mermaid、katex），不引入新的构建工具链或打包步骤
- **FR-008**: 系统 MUST 保持零配置启动体验——用户访问页面即可使用，无需额外构建或编译步骤

### Key Entities

- **消息 (Message)**: 代表一条对话消息，包含角色（user/assistant）、内容（纯文本）、以及解析后的内容段列表（文字段 + Widget 段）
- **内容段 (ContentSegment)**: 消息内容的原子单元，类型包括：纯文本、Mermaid 图表、HTML 可视化、SVG 可视化。每个段有独立的渲染生命周期
- **对话状态 (ConversationState)**: 当前会话的全局状态，包括消息历史、是否正在流式输出、当前活跃的消息段等
- **Widget 实例 (Widget)**: 可视化组件实例，包含类型标签、渲染状态（加载中/已完成/错误）、内容数据、交互能力（放大/全屏）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 重构后的应用在视觉和交互上与原版 100% 一致，用户无需学习即可无缝切换
- **SC-002**: 单个组件文件的代码量不超过 200 行（不含样式），确保可读性
- **SC-003**: 新增一个消息类型的 Widget（如新增 Canvas 类型）所需的代码改动不超过 3 个文件
- **SC-004**: 从零启动到页面可用的加载时间不超过原版的 110%（允许框架带来的轻微开销）

## Assumptions

- 后端 server.py 及其 API 接口不做任何改动，重构范围严格限定在前端
- 继续使用 CDN 加载第三方库（marked、mermaid、katex），不引入 npm 构建工具链
- 不改变现有的 CSS 变量主题系统设计，仅将其迁移到组件化结构中
- 浏览器兼容性要求保持不变（现代浏览器，支持 ES Module、fetch API、IntersectionObserver 等）
- 项目仍然以静态文件方式提供服务（Flask send_from_directory），不需要 SSR 或路由框架
