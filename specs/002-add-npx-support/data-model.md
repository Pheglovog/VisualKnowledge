# Data Model: npx 一键启动

**Feature**: 002-add-npx-support
**Date**: 2026-04-06

## Entities

### Package Configuration (package.json)

| Field | Value | Purpose |
|-------|-------|---------|
| `name` | `visualknowledge` | npm 包名，即 `npx visualknowledge` 的标识 |
| `version` | `0.1.0` | 初始版本 |
| `description` | Interactive AI Chat with Visualization | 包描述 |
| `bin.visualknowledge` | `./bin/visualknowledge.js` | npx 入口命令 |
| `files` | `[bin/, index.html, server.py, skills/]` | 分发文件白名单 |
| `engines.node` | `>=16` | Node.js 最低版本要求 |
| `keywords` | `ai, chat, visualization, claude` | 搜索关键词 |
| `license` | `MIT` | 许可证 |

### Bootstrap Runtime State

Bootstrap 脚本运行时的内部状态（不持久化）：

| State | Type | Description |
|-------|------|-------------|
| `pythonPath` | string | 检测到的 Python 可执行路径 (`python3` 或 `python`) |
| `pythonVersion` | string | Python 版本号 (e.g., "3.10.12") |
| `port` | number | 实际使用的端口号 (默认 5000，冲突时递增) |
| `childProcess` | ChildProcess | Python Flask 子进程引用 |
| `baseUrl` | string | 构建的应用访问 URL (e.g., `http://localhost:5000`) |
| `depsOk` | boolean | Python 依赖是否已安装 |

### State Transitions

```
[Start] → [Env Check] → [Dep Check] → [Port Detect] → [Launch Python] → [Wait Ready] → [Open Browser] → [Keep Alive]
                ↓              ↓              ↓              ↓
            [Error Exit]   [Error Exit]   [Error Exit]   [Error Exit]
                                                              ↓
                                                    [SIGINT → Cleanup → Exit]
```

## Validation Rules

- Node.js version MUST be >= 16 (ES6 modules support, modern child_process API)
- Python version MUST be >= 3.10 (match existing project constraint)
- Port range: 5000–5010 (max 10 retries)
- Package name `visualknowledge` MUST be available on npm registry (or scoped)
