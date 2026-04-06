# CLI Contract: visualknowledge

**Feature**: 002-add-npx-support
**Date**: 2026-04-06

## Command Interface

### Invocation

```bash
npx visualknowledge [options]
```

### Options

| Option | Short | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--port` | `-p` | number | 5000 (auto-increment if taken) | 指定起始端口号 |
| `--no-open` | | boolean | false | 启动后不自动打开浏览器 |
| `--help` | `-h` | | | 显示帮助信息 |
| `--version` | `-v` | | | 显示版本号 |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | 正常退出（用户 Ctrl+C 或进程结束） |
| 1 | 环境错误（Node.js/Python 版本不足、依赖缺失） |
| 2 | 端口错误（5000-5010 全部被占用） |

## Terminal Output Specification

### 成功启动流程

```
$ npx visualknowledge

  VisualKnowledge v0.1.0

  ✓ Node.js v20.11.0
  ✓ Python 3.10.12
  ✓ Dependencies OK (flask, anthropic)
  ✓ Port 5000 available

  Starting server...
  → http://localhost:5000

  (browser opens automatically)
```

### 环境缺失时

```
$ npx visualknowledge

  ✗ Python 3.10+ not found
    Installed: python 3.8.10
    Required: >= 3.10.0

  Fix: Install Python 3.10+ from https://www.python.org/downloads/
       Or via: brew install python@3.10  (macOS)
                sudo apt install python3.10  (Ubuntu)
```

### 依赖缺失时

```
$ npx visualknowledge

  ✓ Node.js v20.11.0
  ✓ Python 3.10.12
  ✗ Missing Python dependencies:
      - flask
      - anthropic

  Fix: pip install flask anthropic
```

### 端口全部占用时

```
$ npx visualknowledge

  ✓ Environment OK
  ✗ No available port in range 5000-5010

  Fix: Stop other services using these ports,
       or use --port to specify a different start port.
```

## Signal Handling

| Signal | Behavior |
|--------|----------|
| SIGINT (Ctrl+C) | 转发到 Python 子进程 → 等待最多 3s → 强制终止 → exit(0) |
| SIGTERM | 同 SIGINT |

## Browser Opening Behavior

- 默认行为：服务就绪后异步调用系统命令打开浏览器
- 失败处理：输出警告但不影响服务运行（`⚠ Could not open browser automatically`）
- 可通过 `--no-open` 禁用
