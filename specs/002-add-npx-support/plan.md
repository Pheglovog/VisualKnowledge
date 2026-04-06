# Implementation Plan: npx 一键启动与浏览器自动跳转

**Branch**: `002-add-npx-support` | **Date**: 2026-04-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-add-npx-support/spec.md`

## Summary

为 VisualKnowledge 项目添加 `npx visualknowledge` 一键启动能力。用户无需手动克隆仓库或安装依赖，通过单条 npx 命令即可完成：环境检测 → 依赖安装 → Python/Flask 后端启动 → 自动打开浏览器。核心新增文件为 `package.json`（npm 包配置）和 `bin/visualknowledge.js`（Node.js 启动脚本），后者负责协调 Node.js 与 Python 双运行时。

## Technical Context

**Language/Version**: JavaScript (Node.js 16+ for bootstrap script), Python 3.10+ (existing backend)
**Primary Dependencies**: Node.js built-in modules (child_process, http, net, os), no external npm dependencies
**Storage**: N/A (no new data persistence)
**Testing**: Manual E2E testing via npx invocation
**Target Platform**: macOS, Linux, Windows (WSL)
**Project Type**: CLI tool wrapping existing web-service
**Performance Goals**: Cold start <30s, warm start <10s
**Constraints**: Zero npm runtime dependencies; must work offline after first install; single-file bin script preferred
**Scale/Scope**: Single-user local tool

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Visualization-First | PASS | No visualization changes |
| II. SPA + Knowledge Platform | PASS | Existing SPA unchanged; bootstrap only starts it |
| III. User-Local Config | PASS | No config changes; respects existing env var / user-local config |
| IV. Streaming & Real-Time | PASS | No streaming changes |
| V. Theme-Agnostic Rendering | PASS | No rendering changes |
| VI. Privacy-First | PASS | Bootstrap script runs locally; no data exfiltration; no telemetry |
| VII. Commit-Before-Change | N/A | Not modifying skills/prompts |
| VIII. Multi-Backend Compatibility | PASS | No backend abstraction changes |

**Gate Result**: ALL PASS — no violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-add-npx-support/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cli-contract.md  # CLI interface contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
package.json              # NEW - npm package manifest (name, bin, files)
bin/
└── visualknowledge.js   # NEW - npx entry point (bootstrap script)

index.html               # EXISTING - unchanged
server.py                # EXISTING - unchanged
skills/                  # EXISTING - unchanged
```

**Structure Decision**: 最小化改动方案——仅新增 `package.json` 和 `bin/visualknowledge.js` 两个文件。不修改任何现有代码。Bootstrap 脚本作为纯入口层，职责是环境检测、Python 进程管理和浏览器打开。

## Complexity Tracking

> 无宪法违规，此表留空。
