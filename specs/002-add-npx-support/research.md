# Research: npx 一键启动与浏览器自动跳转

**Feature**: 002-add-npx-support
**Date**: 2026-04-06

## R1: 包分发策略 — 如何让 npx 下载并运行 Python 项目

**Decision**: 使用 `package.json` + `bin` 入口 + `files` 白名单模式

**Rationale**:
- npx 执行流程：`npx <pkg>` → 下载 tarball 到缓存 → 解压 → 执行 `bin` 字段指定的脚本
- Python 后端文件（server.py, skills/, index.html）需要通过 npm 分发，因此必须列入 `files` 字段
- 不使用 `prepare`/`install` 脚本安装 Python 依赖，改为在运行时按需检测和提示
- 这避免了跨平台 pip 调用的复杂性

**Alternatives considered**:
- `npx-pkg` / `pkg` 打包成单一可执行文件：过度工程化，且不支持 Python 子进程
- 仅作为 git 依赖：用户仍需手动 clone，不符合"零配置"目标
- 使用 `postinstall` 安装 Python deps：pip 在不同系统上路径不一致，容易失败

## R2: Bootstrap 脚本 — Node.js 协调 Python 运行时

**Decision**: 纯 Node.js 内置模块实现，零外部依赖

**Rationale**:
- `child_process.spawn` 启动 Python Flask 进程
- `child_process.exec` 用于环境检测（python --version, pip list）
- `net.createServer` 做端口可用性探测
- `os.platform()` + `process.platform` 处理跨平台差异
- 零 npm 依赖意味着更快的 npx 下载速度和更高的可靠性

**Key patterns**:
- 使用 `stdio: 'inherit'` 让 Python 进程的 stdout/stderr 直接透传到终端
- 监听 Python 进程的 stdout 输出中的 "Running on" 模式来确认服务就绪
- `SIGINT` / `SIGTERM` 信号转发到子进程实现优雅退出

**Alternatives considered**:
- Shell script (bin 入口直接调用 .sh)：Windows 兼容性问题
- Python 作为入口（npm install 后 python server.py）：破坏"Node.js first"的 npx 体验
- 使用 `opener` npm 包：增加不必要的依赖，`child_process.exec('open')` 已足够

## R3: 浏览器自动打开 — 跨平台方案

**Decision**: 根据平台选择命令

| Platform | Command |
|----------|---------|
| macOS | `open <url>` |
| Linux | `xdg-open <url>` |
| Windows | `start <url>` |

**Rationale**:
- 这些是各 OS 的标准"打开默认应用"命令
- 通过 `child_process.exec` 异步执行，不阻塞主进程
- 如果打开失败（命令不存在），仅输出警告而不影响服务运行

**Alternatives considered**:
- `open` npm 包：功能相同但增加了依赖
- 手动构建 URL 协议处理：过度复杂，标准命令已满足需求

## R4: 端口冲突检测与自动递增

**Decision**: 尝试绑定端口 → 失败则 +1 重试，上限 10 次

**Rationale**:
- 使用 `net.createServer().listen(port, host)` 检测端口占用
- 立即 `.close()` 释放（实际由 Python Flask 进程使用该端口）
- 从默认端口 5000 开始，每次冲突 +1，直到找到空闲端口或达到上限
- 这是 Node.js 社区的标准做法（如 `portfinder` 库的核心逻辑）

**Alternatives considered**:
- 直接启动 Flask 并捕获 OSError：Flask 错误信息不够结构化，且无法提前知道最终端口
- 固定端口 + 报错退出：用户体验差（P2 用户故事要求自动切换）

## R5: Python 依赖管理策略

**Decision**: 运行时检测 + 友好提示，不自动安装

**Rationale**:
- 项目依赖为 `flask` 和 `anthropic` SDK
- 自动 pip install 需要 sudo 权限或虚拟环境，在 npx 场景下过于侵入
- 最佳实践是检测缺失后给出清晰的安装命令提示
- 用户只需运行一次 `pip install flask anthropic` 即可

**Detection logic**:
1. 检查 `python3` 或 `python` 是否存在
2. 检查版本 >= 3.10
3. 尝试 `import flask; import anthropic` 验证依赖已安装
4. 任一步骤失败 → 输出错误信息 + 修复命令 → exit(1)

## R6: package.json files 字段 — 最小化包体积

**Decision**: 显式白名单，排除非必要文件

**Files to include**:
- `bin/` — 启动脚本
- `index.html` — 前端 SPA
- `server.py` — Flask 后端
- `skills/` — 可视化技能定义
- `package.json` — 自身
- `README.md`（如果存在）— 使用说明

**Files to exclude**:
- `.git/`, `.specify/`, `.claude/` — 开发工具
- `specs/` — 规格文档
- `node_modules/` — 无此目录（零依赖）
- `__pycache__/`, `*.pyc` — Python 缓存
- `.DS_Store`, `*.log` — 系统文件
