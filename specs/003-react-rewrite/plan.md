# Implementation Plan: 前端 React 重构

**Branch**: `003-react-rewrite` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-react-rewrite/spec.md`

## Summary

将当前单文件 `index.html`（~1050 行）前端重构为基于 React 的组件化架构。使用 ESM CDN（esm.sh）+ htm 标签模板实现零构建步骤的 React 开发体验，保持所有现有功能 100% 不变。核心变更：新增 `frontend/` 目录包含组件化源码、拆分 CSS 为 8 个独立文件、封装 StreamProcessor 纯函数层实现流式渲染与 UI 解耦。

## Technical Context

**Language/Version**: JavaScript (ES2022+, via browser-native ESM), JSX 替代为 htm 标签模板
**Primary Dependencies**: React 18 (esm.sh CDN), ReactDOM 18, htm 3 (标签模板), marked (CDN), mermaid@10 (ESM CDN), katex@0.16 (CDN)
**Storage**: N/A (无新数据持久化)
**Testing**: 手动 E2E 测试 + 视觉回归对比
**Target Platform**: 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)
**Project Type**: SPA 前端重构（Web application frontend）
**Performance Goals**: 首屏加载 < 原版 × 110%；流式渲染延迟无感知增加
**Constraints**: 零构建步骤、零 npm 运行时依赖、CDN 加载第三方库、Flask 静态文件服务
**Scale/Scope**: 单用户本地工具，SPA 单页面

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Visualization-First | PASS | 无可视化逻辑变更，仅重构载体 |
| II. SPA + Knowledge Platform | **AMENDMENT** | 原则规定"无框架依赖"，本次重构引入 React 以解决可维护性危机。详见 Complexity Tracking |
| III. User-Local Config | PASS | 无配置变更；主题偏好仍存 localStorage |
| IV. Streaming & Real-Time | PASS | SSE 流协议不变，StreamProcessor 封装保留完整状态机 |
| V. Theme-Agnostic Rendering | PASS | CSS 变量系统完整保留，仅从内联 style 拆分为独立 .css 文件 |
| VI. Privacy-First | PASS | 纯客户端重构，无数据流变化 |
| VII. Commit-Before-Change | N/A | 未修改 skills/prompts |
| VIII. Multi-Backend Compatibility | PASS | API 接口不变，前后端契约不变 |

### Gate Result: CONDITIONAL PASS — 1 个 Amendment 需记录

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle II: "no framework dependency" | 当前 ~1050 行单文件已超出可维护阈值，全局变量散落、状态与 DOM 耦合导致每次修改都有连锁风险。React 组件化是业界成熟的解决方案 | 保持 vanilla JS 并手动拆分模块：ES Module 可以拆分文件但无法提供声明式 UI 和自动状态同步，本质上只是把一个混乱的大函数拆成多个混乱的小函数，不解决核心问题 |

**Mitigation**: 使用 ESM CDN（非 npm install），零构建步骤，保持"访问即用"的部署体验不变。宪法原则 II 的核心精神是"零配置部署"，这一点完全保留。

## Project Structure

### Documentation (this feature)

```text
specs/003-react-rewrite/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (6 research decisions)
├── data-model.md        # Phase 1 output (5 entities + state machines)
├── quickstart.md        # Phase 1 output (dev workflow + verification)
├── contracts/
│   └── ui-contract.md   # Phase 1 output (component props + hooks + widget protocol)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
frontend/                        # NEW - React 前端源码
├── index.html                   # 入口 HTML（root div + importmap + CSS/CDN 引用）
├── styles/                      # CSS 文件（从原 index.html 内联样式拆分）
│   ├── variables.css            # CSS 变量 & 双主题定义
│   ├── base.css                 # Reset & body layout
│   ├── top-bar.css              # 顶部导航栏
│   ├── chat-area.css            # 聊天区域 & 滚动条
│   ├── message.css              # 消息气泡 & 头像
│   ├── markdown.css             # Markdown 渲染（代码块/表格/引用/公式）
│   ├── widget.css               # Widget 容器 & 全屏覆盖层
│   └── input-area.css           # 输入框 & 发送按钮
├── src/
│   ├── main.js                  # 入口：ReactDOM.createRoot + App 挂载
│   ├── App.jsx                  # 根组件：布局编排（TopBar + ChatArea + InputArea + FullscreenOverlay）
│   ├── context/
│   │   └── AppContext.jsx       # React Context + useReducer + 初始状态
│   ├── hooks/
│   │   ├── useChat.js           # 核心：SSE 连接管理 + StreamProcessor 协调
│   │   ├── useTheme.js          # 主题切换（localStorage 持久化）
│   │   └── useModels.js         # 模型列表加载（GET /api/models）
│   ├── components/
│   │   ├── TopBar.jsx           # Logo + 标题 + 主题按钮 + 模型选择器
│   │   ├── ChatArea.jsx         # 滚动容器 + 自动到底部
│   │   ├── WelcomeScreen.jsx    # 空状态欢迎页
│   │   ├── MessageList.jsx      # 消息列表（含空状态判断）
│   │   ├── Message.jsx          # 消息分发（user → UserMessage, assistant → AssistantMessage）
│   │   ├── UserMessage.jsx      # 用户消息气泡
│   │   ├── AssistantMessage.jsx # AI 消息（avatar + ContentSegment 列表 + TypingIndicator）
│   │   ├── TextPart.jsx         # Markdown 文本段（dangerouslySetInnerHTML + KaTeX）
│   │   ├── TypingIndicator.jsx  # 三点动画
│   │   ├── widgets/
│   │   │   ├── WidgetContainer.jsx  # Widget 外壳（badge + typeLabel + status + zoom btn）
│   │   │   ├── MermaidWidget.jsx    # Mermaid 图表（异步渲染 + 错误处理）
│   │   │   ├── HtmlWidget.jsx       # HTML iframe 可视化（实时预览 + 全屏）
│   │   │   ├── SvgWidget.jsx        # SVG 可视化（增量解析 + 放大）
│   │   │   └── FullscreenOverlay.jsx # 全屏覆盖层（Escape 关闭）
│   │   └── InputArea.jsx        # Textarea + 自动高度 + 发送按钮
│   ├── lib/
│   │   ├── streamProcessor.js   # 流式文本解析器（纯类，无 DOM 依赖）
│   │   ├── markdownRenderer.js  # marked + KaTeX 封装
│   │   └── mermaidRenderer.js   # mermaid.initialize + render 封装
│   └── utils/
│       └── escape.js            # HTML 实体转义

index.html                        # OLD - 保留作为参考（重构完成后删除或归档）
server.py                         # EXISTING - 不变
```

**Structure Decision**: 采用 Option 2 变体——`frontend/` 目录存放全部前端源码，根目录的旧 `index.html` 在验证通过后移除。后端 server.py 完全不动。Flask 的 `send_from_directory` 需要更新路径指向 `frontend/index.html`。
