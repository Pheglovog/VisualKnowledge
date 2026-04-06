# Feature Specification: npx 一键启动与浏览器自动跳转

**Feature Branch**: `002-add-npx-support`
**Created**: 2026-04-06
**Status**: Draft
**Input**: User description: "我需要确保该项目可以使用npx下载使用，执行后，跳转到网页上"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 通过 npx 一键启动应用 (Priority: P1)

用户在终端中执行 `npx visualknowledge` 命令后，系统自动完成所有依赖安装、服务启动，并默认在浏览器中打开应用页面。整个过程无需用户手动克隆仓库、安装依赖或配置环境。

**Why this priority**: 这是核心价值主张——零配置、一键体验。没有这个能力，npx 分发就没有意义。

**Independent Test**: 在一台全新机器上执行 `npx visualknowledge`，验证服务启动且浏览器自动打开正确地址。

**Acceptance Scenarios**:

1. **Given** 用户在一台已安装 Node.js 的机器上, **When** 执行 `npx visualknowledge`, **Then** 系统自动下载并启动服务，浏览器自动打开应用首页
2. **Given** 用户未预先克隆项目代码, **When** 执行 `npx visualknowledge`, **Then** 无需手动 git clone 或 npm install 即可运行
3. **Given** 服务正常启动, **When** 浏览器打开, **Then** 页面显示完整的聊天界面（包含输入框、模型选择器等）

---

### User Story 2 - 端口冲突自动处理 (Priority: P2)

当默认端口被占用时，系统能够自动切换到可用端口，并在浏览器中打开正确的地址。

**Why this priority**: 提升用户体验的健壮性，避免因端口冲突导致首次使用失败。

**Independent Test**: 先占用默认端口，再执行 npx 命令，验证系统自动选择新端口并正确打开。

**Acceptance Scenarios**:

1. **Given** 默认端口已被其他进程占用, **When** 执行 `npx visualknowledge`, **Then** 系统自动使用下一个可用端口，终端显示实际使用的端口号
2. **Given** 端口自动切换成功, **When** 服务启动完成, **Then** 浏览器打开的 URL 包含正确的端口号

---

### User Story 3 - 优雅退出与清理 (Priority: P3)

用户可以通过 Ctrl+C 或关闭浏览器标签页来停止服务，进程能够干净退出，不残留僵尸进程或临时文件。

**Why this priority**: 保证用户体验完整性，但优先级低于核心启动流程。

**Independent Test**: 启动服务后按 Ctrl+C，验证进程完全退出且无残留。

**Acceptance Scenarios**:

1. **Given** 服务正在运行, **When** 用户按下 Ctrl+C, **Then** 服务在 3 秒内完全退出，终端返回命令行提示符
2. **Given** 服务正在运行, **When** 进程异常终止, **Then** 不产生临时文件残留

---

### Edge Cases

- 用户机器未安装 Python（项目依赖 Python 后端）时如何处理？
- 用户网络不稳定导致 npx 下载超时时如何提示？
- 用户同时运行多个实例时如何处理？
- 用户使用的 Node.js 版本过低时不兼容如何提示？

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 支持通过 `npx visualknowledge` 命令一键启动完整应用
- **FR-002**: 系统 MUST 在启动完成后自动打开默认浏览器并导航到应用地址
- **FR-003**: 系统 MUST 自动检测并验证项目所需的运行时依赖（Python 后端依赖 flask、anthropic 等）已安装，缺失时输出明确的 `pip install` 安装指引并退出（不自动执行安装）
- **FR-004**: 系统 MUST 当默认端口被占用时自动递增寻找可用端口
- **FR-005**: 系统 MUST 在终端输出清晰的状态信息（启动进度、访问地址、错误信息）
- **FR-006**: 系统 MUST 支持 Ctrl+C 信号优雅关闭所有子进程
- **FR-007**: 系统 MUST 包含 package.json 并声明 bin 入口字段以支持 npx 调用
- **FR-008**: 系统 MUST 检测必要的运行环境（Node.js 版本、Python 是否可用），不满足时给出明确提示

### Key Entities

- **Package Configuration (package.json)**: 定义包名、版本、bin 入口、依赖声明
- **Bootstrap Script (bin 入口)**: 负责环境检测、依赖验证与提示、服务启动、浏览器打开
- **Runtime Environment**: Node.js + Python 双运行时的协调与管理

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 新用户从 npx 包加载完成后到看到聊天界面的耗时不超过 30 秒（不含 npm registry 下载时间，含 Python 依赖检测 + Flask 启动 + 浏览器打开）
- **SC-002**: 回访用户（npx 缓存已命中）从执行命令到看到界面不超过 10 秒
- **SC-003**: 用户无需阅读任何文档即可通过单条命令完成"安装→启动→使用"全流程
- **SC-004**: 端口冲突场景下，用户仍能成功启动并访问应用（100% 成功率）
- **SC-005**: 缺少必要运行环境时，用户能在 5 秒内收到明确的错误指引

## Assumptions

- 用户机器已安装 Node.js (v16+) 和 Python (3.10+)
- 用户操作系统为 macOS、Linux 或 Windows (WSL)
- 项目现有的 Flask 后端和前端文件结构保持不变
- npx 会自动从 npm registry 下载包，不需要额外的发布渠道配置
- 首次运行时需要下载依赖，后续运行可利用缓存加速
