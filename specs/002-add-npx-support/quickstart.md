# Quickstart: npx 一键启动

**Feature**: 002-add-npx-support
**Date**: 2026-04-06

## Prerequisites

| Requirement | Minimum Version | Check Command |
|-------------|-----------------|---------------|
| Node.js | 16+ | `node --version` |
| Python | 3.10+ | `python3 --version` |
| pip (with flask, anthropic) | latest | `pip list \| grep -E "flask\|anthropic"` |

## Quick Start (3 steps)

### 1. Install Python dependencies (one-time)

```bash
pip install flask anthropic
```

### 2. Configure API key (one-time)

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Or add to `~/.visualknowledge/config.json` (if user-local config is implemented).

### 3. Run

```bash
npx visualknowledge
```

Browser opens automatically at `http://localhost:5000`.

## For Developers (local development)

```bash
# Traditional way still works:
python server.py

# Or via npx (after npm link):
npm link
visualknowledge
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `command not found: npx` | Install Node.js from nodejs.org |
| `Python not found` | Install Python 3.10+, ensure `python3` is in PATH |
| `Missing dependencies` | Run `pip install flask anthropic` |
| Port 5000 in use | Script auto-selects next port, or use `npx visualknowledge --port 8080` |
| Blank page / no models | Check `ANTHROPIC_API_KEY` environment variable |
