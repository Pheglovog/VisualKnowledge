# Quickstart: Constitution Alignment v1.1.0

**Feature**: `001-constitution-alignment`
**Date**: 2026-04-06

## Prerequisites

- Python 3.10+
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Edge, Safari)

## Installation & First Run

### 1. Clone and Install Dependencies

```bash
cd /path/to/VisualKnowledge
pip install flask anthropic
```

### 2. Start Server (First Time — Setup Wizard)

```bash
python server.py
```

On first run, the setup wizard appears:

```
==================================================
  VisualKnowledge - Interactive AI Visualization
==================================================

Welcome! Let's configure your settings.

  [1/5] API Key: ••••••••••••••••
  [2/5] Base URL [https://open.bigmodel.cn/api/anthropic]:
  [3/5] Model [GLM-5V-Turbo]:
  [4/5] Backend (claude_code / obsidian) [claude_code]:
  [5/5] Port [5000]:

✓ Configuration saved to ~/.visualknowledge/config.json
```

### 3. Open Browser

Navigate to **http://localhost:5000**

The chat interface loads with:
- Chat panel (left/center) — existing functionality preserved
- Knowledge base panel (right/sidebar) — NEW: notes list, search, export

## Verification Checklist

### Existing Functionality (Regression Test)

- [ ] Chat message sends and streams response via SSE
- [ ] HTML visualizations render correctly in chat bubbles
- [ ] Mermaid diagrams render correctly
- [ ] Light/dark theme toggle works
- [ ] Model selector shows available models
- [ ] Error messages display gracefully

### New Functionality (Constitution Alignment)

- [ ] Config file created at `~/.visualknowledge/config.json` on first run
- [ ] Second startup skips wizard, reads config silently
- [ ] Environment variable overrides config file values (e.g., `ANTHROPIC_API_KEY=sk-new python server.py`)
- [ ] No chat content appears in server terminal logs
- [ ] After server restart, previous conversation is gone (privacy check)
- [ ] "Save as Note" button visible in chat UI
- [ ] Clicking "Save as Note" creates entry in knowledge panel
- [ ] Note includes title, summary, tags, and visualization snippets
- [ ] Search bar filters notes by keyword in real-time
- [ ] "Export Markdown" downloads .md file
- [ ] "Delete" removes note from UI and database
- [ ] Tags display as badges on note cards
- [ ] `/api/tags` returns tag list with counts
- [ ] `/api/config/status` returns sanitized config (no API key)

### Privacy Audit

- [ ] Check `~/.visualknowledge/` — only `config.json` and `knowledge.db` exist (no chat logs)
- [ ] Search project directory for any `.log`, `.db`, `.json` files containing conversation text — must find none
- [ ] Send a message with unique keyword → grep entire filesystem for that keyword → only find it in network traffic (not on disk)

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `config.py` | **NEW** | Config loader, setup wizard, validation |
| `backend/__init__.py` | **NEW** | Backend adapter registry |
| `backend/claude_adapter.py` | **NEW** | Extracted Anthropic client |
| `backend/obsidian_adapter.py` | **NEW** | Obsidian stub |
| `knowledge/__init__.py` | **NEW** | Knowledge module init |
| `knowledge/models.py` | **NEW** | SQLite schema + Note model |
| `knowledge/crud.py` | **NEW** | Note CRUD + search + export |
| `server.py` | **MODIFY** | Wire up new modules; remove hardcoded config; add new routes |
| `index.html` | **MODIFY** | Add KB panel, note save/search/export UI |
| `.gitignore` | **MODIFY** | Add `~/.visualknowledge/` pattern (safety) |

## Manual Testing Scenarios

### Scenario A: Fresh Install Flow
```bash
# Clean state
rm -rf ~/.visualknowledge
python server.py
# → Setup wizard appears
# → Fill in values
# → Verify ~/.visualknowledge/config.json created
# → Verify ~/.visualknowledge/knowledge.db created on first note save
```

### Scenario B: Privacy Verification
```bash
python server.py
# Send message: "TEST_PRIVACY_CHECK_UNIQUE_STRING_12345"
# Wait for response
# Ctrl+C to stop server
# Run: grep -r "TEST_PRIVACY_CHECK" ~ --include="*.json" --include="*.db" --include="*.log"
# Expected: NO matches found (except in network traffic which we can't check via grep)
```

### Scenario C: Config Override
```bash
ANTHROPIC_MODEL=custom-model-name python server.py
# GET /api/models should show "current": "custom-model-name"
```

### Scenario D: Knowledge Base Operations
```bash
# 1. Have a conversation with visualizations
# 2. Click "Save as Note"
# 3. Verify note appears in sidebar
# 4. Type in search box → verify filtering works
# 5. Click "Export Markdown" → verify download
# 6. Click "Delete" → confirm removal
# 7. Restart server → verify notes persist (they're in SQLite, this is expected per user action)
```
