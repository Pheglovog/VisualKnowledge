# Tasks: Constitution Alignment v1.1.0

**Input**: Design documents from `/specs/001-constitution-alignment/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-contract.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `server.py`, `config.py`, `backend/`, `knowledge/` at repository root
- **User data**: `~/.visualknowledge/config.json`, `~/.visualknowledge/knowledge.db`
- Paths shown below follow plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic module structure

- [ ] T001 Create `backend/` and `knowledge/` directories with `__init__.py` files at `backend/__init__.py` and `knowledge/__init__.py`
- [ ] T002 [P] Add commit discipline reminder comment block at top of `skills/visualize.py` per Principle VII
- [ ] T003 [P] Update `.gitignore` to add `~/.visualknowledge/` pattern as safety net (user data must never enter repo)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Implement config loader in `config.py`: `load_config()` reads `~/.visualknowledge/config.json`; returns dict with defaults; handles missing file gracefully; validates JSON structure; supports env var override layer (`ANTHROPIC_API_KEY` > config, `ANTHROPIC_BASE_URL` > config, `ANTHROPIC_MODEL` > config)
- [ ] T005 Implement setup wizard in `config.py`: `run_setup_wizard()` interactive terminal flow using `input()` and `getpass.getpass()` for masked API key input; prompts for api_key, base_url (default), model (default), backend type (default), port (default); validates inputs (URL format, key min-length); creates `~/.visualknowledge/` directory; writes `config.json` with `0600` permissions on Unix; handles corrupted JSON with clear error message
- [ ] T006 [P] Define abstract `BackendAdapter` base class in `backend/__init__.py` with ABC methods: `stream_chat(messages, model, system_prompt) -> Generator[dict]`, `list_models() -> list[str]`, `name() -> str` classmethod; implement `BACKEND_REGISTRY` dict and `register_backend()` decorator + `get_backend(name)` factory function
- [ ] T007 [P] Implement SQLite schema in `knowledge/models.py`: `init_db(db_path)` creates tables (`notes`, `tags`, `note_tags`) and FTS5 virtual table (`notes_fts`) with auto-sync triggers per data-model.md schema; database path defaults to `~/.visualknowledge/knowledge.db`
- [ ] T008 Configure sanitized logging in `server.py`: remove or guard `full_response` content logging (keep only char count metric); ensure error handlers log exception type + message but NEVER user message body or AI response text; set logger format to exclude sensitive data

**Checkpoint**: Foundation ready — config system, adapter interface, DB schema, privacy logging all operational

---

## Phase 3: User Story 1 - First-Time Setup Wizard (Priority: P1) 🎯 MVP

**Goal**: Users can launch the app and configure it via interactive wizard without manual file editing.

**Independent Test**: Delete `~/.visualknowledge/` → run `python server.py` → wizard appears → fill values → config created → restart → loads silently → env var override works.

### Implementation for User Story 1

- [ ] T009 [US1] Wire config loading into `server.py` startup: import `config.py`; call `load_config()` at module level; if config missing call `run_setup_wizard()` before `app.run()`; extract `API_KEY`, `BASE_URL`, `MODEL` from loaded config dict (remove old `os.environ.get` calls for these values); keep `PORT` from config
- [ ] T010 [US1] Update `GET /api/models` endpoint in `server.py` to read model list from config instead of hardcoded `os.environ.get` calls; return current model from config
- [ ] T011 [US1] Add `GET /api/config/status` endpoint in `server.py`: returns `{configured, backend, model, base_url, config_path}` — MUST NOT include `api_key` or any secret value; return 500 if config not loaded
- [ ] T012 [US1] Handle edge cases in `config.py`: corrupted JSON file → print error + exit; missing `~/.visualknowledge/` directory creation permission → print error + exit; Ctrl+C during wizard → clean exit without partial config file

**Checkpoint**: Setup wizard fully functional — first-run experience complete, config persists, restarts silently

---

## Phase 4: User Story 2 - Privacy-Protected Chat Session (Priority: P1) 🎯 MVP

**Goal**: Zero chat data on disk; session-only memory; sanitized logs; privacy verifiable.

**Independent Test**: Send unique message → grep filesystem for it → no matches found → restart → conversation gone.

### Implementation for User Story 2

- [ ] T013 [US2] Audit `server.py` chat endpoint (`POST /api/chat`): confirm NO file write operations exist for chat data; remove any accidental disk persistence (temp files, cache, etc.); verify `generate()` function only yields SSE events to network socket
- [ ] T014 [US2] Replace `full_response` variable usage in `server.py` `generate()` function: if used only for length logging, keep just `len(full_response)` metric; if logged with content, replace with length-only metric; ensure no path exists where response text reaches disk or logs
- [ ] T015 [US2] Add privacy assertion comment block in `server.py` above chat route: document that this endpoint MUST NOT persist chat data; reference Constitution Principle VI; serve as code-level enforcement reminder
- [ ] T016 [US2] Verify error handling in `server.py` `generate()`: exception catch block MUST log `str(e)` type/message only — never `data.get('messages', [])` or response content; test with intentional bad API key to confirm clean error output

**Checkpoint**: Privacy architecture verified — no chat data leakage path exists

---

## Phase 5: User Story 4 - Multi-Backend Support (Priority: P2)

**Goal**: Pluggable AI backend abstraction; Claude Code primary adapter extracted; Obsidian stub ready.

**Independent Test**: Set `backend: "claude_code"` in config → chat works; set unknown backend → clear error on startup.

### Implementation for User Story 4

- [ ] T017 [US4] Extract Anthropic client logic from `server.py` into `backend/claude_adapter.py`: implement `ClaudeCodeAdapter(BackendAdapter)` class; `__init__` takes `api_key`, `base_url`; `stream_chat()` wraps existing `client.messages.stream()` logic yielding `{'type': 'text', 'content': delta}` and `{'type': 'error', 'message': ...}` dicts; `list_models()` returns models from config/env; `name()` returns `"claude_code"`
- [ ] T018 [US4] Create Obsidian stub adapter in `backend/obsidian_adapter.py`: implement `ObsidianAdapter(BackendAdapter)` class; all methods raise `NotImplementedError("Obsidian backend not yet implemented. Please use 'claude_code' backend.")` with guidance message; `name()` returns `"obsidian"`; register via `@register_backend`
- [ ] T019 [US4] Register both adapters in `backend/__init__.py`: import `ClaudeCodeAdapter` and `ObsidianAdapter`; ensure they auto-register via `@register_backend` decorator; validate `BACKEND_REGISTRY` has both entries after import
- [ ] T020 [US4] Refactor `server.py` `POST /api/chat` route: replace direct `Anthropic(...)` client creation with `get_backend(config['backend'])` factory call; instantiate adapter with config credentials; call `adapter.stream_chat(messages, model, SYSTEM_PROMPT)` instead of inline streaming logic; preserve exact SSE protocol contract (`data: {...}\n\n` format, `[DONE]` signal)
- [ ] T021 [US4] Add backend validation at startup in `server.py`: after config load, check `config['backend']` is in `BACKEND_REGISTRY.keys()`; if unknown, print error message listing available backends and `sys.exit(1)`; log which backend is active

**Checkpoint**: Backend abstraction complete — Claude Code working via adapter, Obsidian stubbed, server validates backend choice

---

## Phase 6: User Story 3 - One-Click Note Summarization & Knowledge Base (Priority: P2)

**Goal**: Save conversations as structured notes in local SQLite; browse, search, export, delete notes from web UI.

**Independent Test**: Have conversation → click "Save as Note" → note appears in KB panel → search filters → export downloads .md → delete removes from DB+UI.

### Implementation for User Story 3 — Backend (CRUD Layer)

- [ ] T022 [P] [US3] Implement note CRUD operations in `knowledge/crud.py`: `create_note(db_path, title, content, summary, tags, source_model) -> int` (insert note, resolve/create tags, return note_id); `get_note(db_path, note_id) -> dict` (single note with tags); `list_notes(db_path, query, tag, limit, offset) -> tuple[list, int]` (FTS5 search + pagination); `delete_note(db_path, note_id) -> bool` (cascade delete); `export_markdown(db_path, note_id) -> str` (return raw markdown string); `list_tags(db_path) -> list[dict]` (tag names with counts)
- [ ] T023 [P] [US3] Implement summarization prompt builder in a helper function (can live in `server.py` or `knowledge/crud.py`): `build_summarization_prompt(messages, visualizations) -> str` constructs system prompt asking AI to generate structured output: title (<80 chars), summary (3-5 bullet points), suggested tags (3-5 keywords), formatted Markdown with embedded visualization HTML snippets
- [ ] T024 [US3] Add `POST /api/notes` endpoint in `server.py`: accept `{messages, visualizations}` request body; validate non-empty messages; call `build_summarization_prompt()` then `adapter.stream_chat()` in non-streaming mode (collect full response); parse AI-generated structured output; call `crud.create_note()` with parsed result; return 201 with created note JSON; handle AI failure and DB failure with appropriate error codes
- [ ] T025 [US3] Add `GET /api/notes` endpoint in `server.py`: support query params `q` (search), `tag`, `limit`, `offset`; call `crud.list_notes()`; return `{notes: [...], total: N, query: "..."}` JSON
- [ ] T026 [P] [US3] Add `GET /api/notes/{id}` endpoint in `server.py`: call `crud.get_note()`; return full note with tags; 404 if not found
- [ ] T027 [P] [US3] Add `GET /api/notes/{id}?format=markdown` endpoint in `server.py`: call `crud.export_markdown()`; return `text/markdown` with `Content-Disposition: attachment` header; 404 if not found
- [ ] T028 [P] [US3] Add `DELETE /api/notes/{id}` endpoint in `server.py`: call `crud.delete_note()`; return `{deleted: true, id: N}`; 404 if not found
- [ ] T029 [P] [US3] Add `GET /api/tags` endpoint in `server.py`: call `crud.list_tags()`; return `{tags: [{name, count}, ...]}` JSON

### Implementation for User Story 3 — Frontend (KB UI Panel)

- [ ] T030 [US3] Add knowledge base sidebar/panel HTML structure to `index.html`: collapsible panel (right side or drawer) containing: search input field, note list (cards showing title + date + tag badges), empty state message, selected note detail view (full Markdown rendered, action buttons: Export MD, Delete)
- [ ] T031 [US3] Add "Save as Note" button to `index.html` chat UI: button placed in chat input area or message toolbar; onclick collects current conversation messages array + extracts visualization HTML from rendered bubbles; POSTs to `/api/notes`; shows loading spinner during AI summarization; shows success toast notification with note title on completion; shows error toast on failure
- [ ] T032 [US3] Implement note list rendering in `index.html`: fetch `GET /api/notes` on panel open; render note cards with title (bold), summary preview (truncated), date (relative format), tag badges (colored pills); click card → load detail view via `GET /api/notes/{id}`
- [ ] T033 [US3] Implement real-time search in `index.html`: bind search input to debounced (300ms) `GET /api/notes?q=...` call; re-render filtered note list; show "N results for 'query'" hint; clear search → show all notes
- [ ] T034 [P] [US3] Implement note detail view in `index.html`: display full title, content (render Markdown to HTML — use simple regex or `<div class="markdown-body">` with basic formatting), tags, source model, timestamps; "Export Markdown" button triggers download via `GET /api/notes/{id}?format=markdown` (window.open or <a download>); "Delete" button shows confirmation dialog then calls `DELETE /api/notes/{id}` and refreshes list
- [ ] T035 [P] [US3] Apply theme-agnostic styling to KB panel in `index.html`: use `background:transparent`, `color:inherit`, low-opacity fills for cards/badges matching existing viz color palette; ensure panel looks correct in both light and dark themes; hover effects on note cards (brightness filter micro-animation per existing style)
- [ ] T036 [US3] Initialize knowledge DB on first note save: ensure `knowledge/models.init_db()` is called before first CRUD operation (lazy init on first `/api/notes` POST or on server startup); create `~/.visualknowledge/knowledge.db` automatically if not exists

**Checkpoint**: Knowledge base fully functional — notes can be saved, searched, browsed, exported, deleted from web UI

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T037 End-to-end integration verification: start server with fresh `~/.visualknowledge/` → complete setup wizard → send chat message with visualization → verify HTML/Mermaid renders → click "Save as Note" → verify note appears in KB panel → search note → export → delete → verify deletion → restart server → verify config persisted but conversation cleared (privacy check)
- [ ] T038 [P] Update `start.example.bat` to reflect new config system: remove hardcoded `set ANTHROPIC_AUTH_TOKEN=...` lines; add comment pointing to `~/.visualknowledge/config.json` and setup wizard; keep env var override examples as optional overrides
- [ ] T039 Run quickstart.md validation: walk through every checklist item in quickstart.md; document any gaps or failures; fix discovered issues
- [ ] T040 Code cleanup: remove dead code from `server.py` (old `os.environ.get` patterns replaced by config loader); ensure no unused imports; verify all new modules have proper docstrings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T004 config, T008 logging) — P1 MVP critical path
- **User Story 2 (Phase 4)**: Depends on Foundational (T008 logging) + US1 server wiring (T009) — P1 MVP critical path
- **User Story 4 (Phase 5)**: Depends on Foundational (T006 adapter base) + US1 config (T009) — P2, shares refactoring effort with US3
- **User Story 3 (Phase 6)**: Depends on Foundational (T007 DB schema, T008 logging) + US1 config (T009) + US4 backend adapter (T020 refactor) — P2, largest phase
- **Polish (Phase 7)**: Depends on ALL user stories being complete

### User Story Dependencies

- **US1 (Setup Wizard)**: Can start after Foundational — No dependencies on other stories
- **US2 (Privacy)**: Can start after Foundational + US1 (needs server.py wired to config) — lightweight, fast to complete
- **US4 (Multi-Backend)**: Can start after Foundational + US1 — independent of US2 and US3
- **US3 (Knowledge Base)**: Can start after Foundational + US1 + US4 (needs backend adapter for summarization call) — depends on US4's adapter refactor being done

### Within Each User Story

- Config/wiring tasks before API endpoint tasks
- Backend CRUD before frontend UI tasks
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

```
Phase 2 (Foundational):
  T004 (config loader) ──────┐
  T005 (setup wizard) ──────┤──→ can partially parallel: T004 must finish before T005
  T006 (adapter base) ──────┤──→ independent of T004/T005
  T007 (DB schema) ─────────┤──→ independent of T004/T005/T006
  T008 (logging) ───────────┘──→ independent of all above

Phase 5 (US4) + Phase 6 (US3 backend):
  T017-T021 (US4 adapters) ──→ must complete before T024 (US3 summarization uses adapter)
  T022-T023 (US3 CRUD+prompt) ──→ can run IN PARALLEL with T017-T021

Phase 6 (US3 frontend):
  T030-T036 (UI tasks) ──→ T030-T032 sequential (structure → save btn → list render)
                       ──→ T033-T035 [P] parallel with T032 (search, detail, styling)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 Setup Wizard
4. Complete Phase 4: US2 Privacy
5. **STOP and VALIDATE**: Test first-run wizard, config persistence, privacy guarantees
6. Deploy/demo core chat functionality with proper config and privacy

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US2 → Test independently → Config + Privacy MVP!
3. Add US4 (Multi-Backend) → Test adapter extraction → Clean architecture
4. Add US3 (Knowledge Base) → Test notes CRUD → Full feature set
5. Each increment adds value without breaking previous increments

### Parallel Team Strategy (if multiple developers)

1. Team completes Setup + Foundational together
2. Once Foundational done:
   - Developer A: US1 (Setup Wizard) + US2 (Privacy) — fast, P1
   - Developer B: US4 (Multi-Backend) — medium, P2
3. After US4 complete:
   - Developer A: US3 Frontend (KB UI panel)
   - Developer B: US3 Backend (CRUD + endpoints)
4. Merge + Polish together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- `skills/visualize.py` MUST NOT be modified without a prior git commit (Principle VII)
- All new frontend components in `index.html` MUST use `color:inherit` and `background:transparent` (Principle V)
- Every endpoint handling user input MUST pass privacy audit (Principle VI)
