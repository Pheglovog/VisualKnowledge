# Implementation Plan: Constitution Alignment v1.1.0

**Branch**: `001-constitution-alignment` | **Date**: 2026-04-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-constitution-alignment/spec.md`

## Summary

Align VisualKnowledge codebase with Constitution v1.1.0 by implementing: (1) user-local config system replacing env-var-only setup, (2) privacy-first architecture with session-only memory and zero disk persistence of chat, (3) knowledge base with SQLite-backed note CRUD and one-click summarization, (4) pluggable multi-backend abstraction supporting Claude Code primary and Obsidian secondary targets, (5) commit discipline enforcement for skill/prompt modifications.

## Technical Context

**Language/Version**: Python 3.10+ (backend), vanilla JavaScript / HTML / CSS (frontend)
**Primary Dependencies**: Flask, anthropic SDK, sqlite3 (stdlib)
**Storage**: SQLite database at `~/.visualknowledge/knowledge.db`
**Testing**: Manual integration testing (no test framework yet; pytest can be added later)
**Target Platform**: Linux/macOS/Windows (WSL2) — local development server
**Project Type**: Web service (SPA frontend + Python Flask backend)
**Performance Goals**: Note search <200ms for <1000 notes; server startup <3s with config
**Constraints**: No build step; no remote services; all data local-only; browser ES6+ required
**Scale/Scope**: Single-user local application; knowledge base scales to thousands of notes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Evaluation

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Visualization-First | PASS | Existing skills preserved; no changes to rendering pipeline |
| II. SPA + Knowledge Platform | PASS | Plan adds note CRUD + KB UI to existing SPA |
| III. User-Local Configuration | PASS | Config file at `~/`, setup wizard, env override layer |
| IV. Streaming & Real-Time Interaction | PASS | SSE contract unchanged |
| V. Theme-Agnostic Rendering | PASS | New UI components follow existing color/inherit rules |
| VI. Privacy-First (NON-NEGOTIABLE) | PASS | Session-only memory; no chat persistence; sanitized logging |
| VII. Commit-Before-Change Discipline | PASS | Git commit gate documented in workflow + pre-change check |
| VIII. Multi-Backend Compatibility | PASS | Adapter pattern with Claude Code primary, Obsidian stubbed |

**Result: ALL GATES PASS** — No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-constitution-alignment/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-contract.md  # API endpoint contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Current structure (preserved, with additions)
server.py                    # Refactored: config loading, backend adapter, privacy controls
index.html                   # Extended: knowledge base UI panel, note save/search/export
skills/
│   └── visualize.py         # Unchanged (commit-before-modify enforced)
config.py                    # NEW: User-local config loader, setup wizard, validation
backend/
│   ├── __init__.py          # NEW: Backend adapter base class / registry
│   ├── claude_adapter.py    # NEW: Anthropic/Claude Code adapter (extracted from server.py)
│   └── obsidian_adapter.py  # NEW: Obsidian adapter (stub/placeholder)
knowledge/
│   ├── __init__.py          # NEW: Knowledge base module init
│   ├── models.py            # NEW: SQLite schema, Note model
│   └── crud.py              # NEW: Note CRUD operations, search, export
~/.visualknowledge/          # USER DATA (not in repo, gitignored)
    ├── config.json          # Runtime configuration (api_key, base_url, model, backend)
    └── knowledge.db         # SQLite knowledge base (notes storage)
```

**Structure Decision**: Flat Python module structure under repository root, matching existing project layout. New modules (`config.py`, `backend/`, `knowledge/`) are co-located with `server.py` and `skills/`. User data lives entirely outside repo at `~/.visualknowledge/`.

## Complexity Tracking

> No unjustified violations. All design decisions align with constitution principles.
