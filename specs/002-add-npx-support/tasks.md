# Tasks: npx 一键启动与浏览器自动跳转

**Input**: Design documents from `/specs/002-add-npx-support/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/cli-contract.md, quickstart.md

**Tests**: 未在规格说明中显式请求测试任务，本任务列表聚焦实现。

**Organization**: 任务按用户故事分组，每个故事可独立实现和验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- 描述中包含精确文件路径

## Phase 1: Setup (项目初始化)

**Purpose**: 创建 npm 包基础结构和 bin 目录

- [x] T001 创建 `package.json` 文件，包含 name(`visualknowledge`)、version(`0.1.0`)、bin 入口指向 `./bin/visualknowledge.js`、files 白名单（bin/, index.html, server.py, skills/）、engines.node >=16
- [x] T002 创建 `bin/` 目录结构

---

## Phase 2: Foundational (环境检测层 — 所有用户故事的前置依赖)

**Purpose**: 实现运行时环境检测逻辑，这是所有用户故事的阻塞前置条件

**⚠️ 关键**: 此阶段完成前无法开始任何用户故事

- [x] T003 在 `bin/visualknowledge.js` 中实现 Node.js 版本检测（要求 >= 16），不满足时输出错误信息并 exit(1)，符合 contracts/cli-contract.md 的输出规范
- [x] T004 在 `bin/visualknowledge.js` 中实现 Python 检测（优先 python3，回退 python），版本 >= 3.10，缺失或版本不足时输出修复指引并 exit(1)
- [x] T005 在 `bin/visualknowledge.js` 中实现 Python 依赖检测（flask, anthropic），通过子进程执行 Python 单行 import 验证，缺失时输出 `pip install` 命令提示并 exit(1)
- [x] T006 在 `bin/visualknowledge.js` 中实现 CLI 参数解析：`--port/-p`（起始端口）、`--no-open`（禁用浏览器打开）、`--help/-h`、`--version/-v`，符合 contracts/cli-contract.md 的选项定义

**Checkpoint**: 环境检测就绪 — 用户故事实现可以开始

---

## Phase 3: User Story 1 - 通过 npx 一键启动应用 (Priority: P1) 🎯 MVP

**Goal**: 用户执行 `npx visualknowledge` 后自动下载、启动服务并打开浏览器

**Independent Test**: 执行 `node bin/visualknowledge.js`（本地模拟 npx），验证 Flask 服务启动且浏览器打开 http://localhost:{port}

### Implementation for User Story 1

- [x] T007 [US1] 在 `bin/visualknowledge.js` 中实现端口可用性检测函数 `findAvailablePort(startPort, maxRetries)`，使用 `net.createServer().listen()` 探测端口，立即 `.close()` 释放，默认从 5000 开始，最多重试 10 次
- [x] T008 [US1] 在 `bin/visualknowledge.js` 中实现 Python Flask 子进程启动函数，使用 `child_process.spawn` 启动 `python server.py`，传入 `--port {actualPort}` 参数，设置 `stdio: 'inherit'` 透传输出，传递当前进程的环境变量（含 ANTHROPIC_API_KEY 等）
- [x] T009 [US1] 在 `bin/visualknowledge.js` 中实现服务就绪检测——监听子进程 stdout 输出中的 "Running on" 或 "http" 模式串来确认 Flask 已绑定端口，超时 15 秒则报错退出
- [x] T010 [US1] 在 `bin/visualknowledge.js` 中实现跨平台浏览器打开函数 `openBrowser(url)`，根据 `process.platform` 选择命令（darwin→`open`，linux→`xdg-open`，win32→`start`），使用 `child_process.exec` 异步执行，失败时仅输出警告 ⚠ 不影响服务运行
- [x] T011 [US1] 在 `bin/visualknowledge.js` 中组装主流程：打印 Banner → 环境检测(T003-T006) → 端口探测(T007) → 启动 Python(T008) → 等待就绪(T009) → **若 opts.noOpen 不为 true 则**打开浏览器(T010) → 输出访问地址 → 保持进程存活
- [x] T012 [US1] 实现 `server.py` 的 `--port` 命令行参数支持，解析 `sys.argv` 中的 port 值覆盖默认的 5000，使 bootstrap 脚本可指定端口启动

**Checkpoint**: User Story 1 完成 — `npx visualknowledge` 可以一键启动完整应用并自动打开浏览器

---

## Phase 4: User Story 2 - 端口冲突自动处理 (Priority: P2)

**Goal**: 默认端口被占用时自动递增寻找可用端口并在浏览器中使用正确地址

**Independent Test**: 先用 `python -m http.server 5000` 占用端口，再执行 `node bin/visualknowledge.js`，验证自动切换到 5001 并在终端和浏览器 URL 中显示正确端口号

### Implementation for User Story 2

- [x] T013 [US2] 增强 T007 的 `findAvailablePort` 函数，当探测到端口被占用时在终端输出 `⚠ Port {port} in use, trying {port+1}...` 提示信息
- [x] T014 [US2] 当所有候选端口(5000-5010)均被占用时，输出明确的错误信息和修复建议（符合 contracts/cli-contract.md 的端口全部占用输出格式），exit(2)
- [x] T015 [US2] 确保 T011 主流程中将实际使用的端口号（而非硬编码 5000）传递给 T010 浏览器打开函数和终端地址输出，使浏览器 URL 自动匹配实际端口

**Checkpoint**: User Story 2 完成 — 端口冲突场景下 100% 成功启动

---

## Phase 5: User Story 3 - 优雅退出与清理 (Priority: P3)

**Goal**: Ctrl+C 信号干净终止 Python 子进程和 Node.js 自身，无残留

**Independent Test**: 启动服务后按 Ctrl+C，验证 3 秒内完全退出，`ps aux | grep` 无残留进程

### Implementation for User Story 3

- [x] T016 [US3] 在 `bin/visualknowledge.js` 中注册 SIGINT 和 SIGTERM 信号处理器，收到信号后向 Python 子进程发送 SIGTERM（或 Windows 的 process.kill）
- [x] T017 [US3] 实现退出等待逻辑：发送终止信号后最多等待 3 秒让 Python 优雅关闭，超时则 `childProcess.kill('SIGKILL')` 强制终止
- [x] T018 [US3] 进程清理后执行 `process.exit(0)` 正常退出，确保无僵尸进程残留；确认脚本运行期间未创建任何临时文件

**Checkpoint**: 所有用户故事独立功能完备

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 收尾工作，确保整体质量

- [x] T019 更新 `.gitignore`，添加 `node_modules/` 条目（虽然零依赖但防御性添加）
- [x] T020 验证 `package.json` 的 `files` 字段完整性——确认只包含必要文件，排除 .git/, .specify/, specs/, __pycache__/ 等非分发内容
- [x] T021 手动 E2E 测试：按 quickstart.md 的步骤完整走一遍 `node bin/visualknowledge.js` 流程，验证所有 Acceptance Scenarios 通过
- [x] T022 [P] 补充 `package.json` 的 description、keywords、license、repository 字段，完善 npm 包元数据

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 — 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 — **阻塞所有用户故事**
- **User Story 1 (Phase 3)**: 依赖 Foundational 完成 — **MVP 核心交付**
- **User Story 2 (Phase 4)**: 依赖 US1 的 T007（端口探测）和 T011（主流程）
- **User Story 3 (Phase 5)**: 依赖 US1 的 T008（子进程启动）和 T011（主流程）
- **Polish (Phase 6)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成后即可开始 — 不依赖其他用户故事
- **User Story 2 (P2)**: 依赖 US1 的端口探测和主流程框架 — 在 US1 基础上增强
- **User Story 3 (P3)**: 依赖 US1 的子进程管理 — 在 US1 基础上增强

### Within Each User Story

- 环境检测必须在服务启动之前
- 端口探测必须在子进程启动之前
- 服务就绪检测必须在浏览器打开之前
- 信号处理可在主流程完成后独立添加

### Parallel Opportunities

- T007（端口探测）、T008（子进程启动）、T010（浏览器打开）是不同功能模块，可在同一文件内并行编写
- T019（gitignore）和 T022（包元数据）是完全独立的文件，可与任何阶段并行
- T013-T015（US2 增强）都是对已有函数的增量修改，需顺序执行

---

## Parallel Example: User Story 1

```bash
# T007, T008, T010 是三个独立功能模块，可在 visualknowledge.js 中并行开发：
Task: "T007 [US1] 实现端口可用性检测函数 findAvailablePort"
Task: "T008 [US1] 实现 Python Flask 子进程启动函数"
Task: "T010 [US1] 实现跨平台浏览器打开函数 openBrowser"

# T012 (server.py --port 支持) 与以上完全独立：
Task: "T012 [US1] 实现 server.py 的 --port 命令行参数支持"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup（T001-T002）
2. 完成 Phase 2: Foundational（T003-T006）— **关键阻塞点**
3. 完成 Phase 3: User Story 1（T007-T012）
4. **停止并验证**: 本地执行 `node bin/visualknowledge.js`，确认一键启动成功
5. 如满足需求可直接发布

### Incremental Delivery

1. Setup + Foundational → 基础设施就绪
2. + User Story 1 → **MVP 可用！** `npx visualknowledge` 一键启动
3. + User Story 2 → 端口冲突不再导致启动失败
4. + User Story 3 → 体验完善，Ctrl+C 干净退出
5. + Polish → 发布就绪

### Task Summary

| Phase | 任务数 | 关键产出 |
|-------|--------|----------|
| Phase 1: Setup | 2 (T001-T002) | package.json, bin/ 目录 |
| Phase 2: Foundational | 4 (T003-T006) | 环境检测 + CLI 参数 |
| Phase 3: US1 (MVP) | 6 (T007-T012) | 核心启动流程 |
| Phase 4: US2 | 3 (T013-T015) | 端口冲突处理 |
| Phase 5: US3 | 3 (T016-T018) | 优雅退出 |
| Phase 6: Polish | 4 (T019-T022) | 收尾与验证 |
| **总计** | **22** | |

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3**（12 个任务）

这是最小可交付单元：用户可以执行 `npx visualknowledge` 并看到完整的聊天界面。US2 和 US3 是体验增强，不影响核心价值。

---

## Notes

- [P] 任务 = 不同文件或独立模块，无互相依赖
- [Story] 标签将任务映射到具体用户故事以便追溯
- 每个用户故事应能独立完成和验证
- T012 需修改现有文件 `server.py`，是唯一涉及既有代码的改动（仅新增 --port 参数解析）
- 所有其他任务均为新增代码，不修改任何现有文件
