# Feature Specification: Constitution Alignment v1.1.0

**Feature Branch**: `001-constitution-alignment`
**Created**: 2026-04-06
**Status**: Draft
**Input**: Align existing VisualKnowledge codebase with Constitution v1.1.0 principles (III, VI, VII, VIII) and expand to Knowledge Platform (II)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Time Setup Wizard (Priority: P1)

User launches VisualKnowledge for the first time. Instead of manually editing environment variables or batch files, an interactive setup flow guides them through configuring API endpoint URL, API key, default model, and preferred backend target (Claude Code / Obsidian). Configuration is saved to `~/.visualknowledge/config.json`. On subsequent launches, the app reads config automatically.

**Why this priority**: Without this, users cannot use the app without manual env-var setup — it is the onboarding blocker.

**Independent Test**: Fresh clone → run `python server.py` → setup wizard appears → configure values → config file exists at `~/.visualknowledge/config.json` → restart → reads config automatically.

**Acceptance Scenarios**:

1. **Given** no config file exists at `~/.visualknowledge/config.json`, **When** server starts, **Then** interactive setup wizard runs in terminal
2. **Given** user completes setup wizard, **When** configuration is saved, **Then** `~/.visualknowledge/config.json` contains api_key, base_url, model, backend fields
3. **Given** config file already exists, **When** server starts, **Then** setup wizard is skipped and config is loaded silently
4. **Given** user sets environment variable override, **When** server starts, **Then** env var takes precedence over config file value

---

### User Story 2 - Privacy-Protected Chat Session (Priority: P1)

User has a conversation with the AI about sensitive topics. All chat content stays in memory only during the session. No conversation logs are written to disk. No data is sent anywhere except the configured AI provider API endpoint. When the server restarts, previous conversations are gone completely.

**Why this priority**: Privacy is NON-NEGOTIABLE per Constitution; this is a trust foundation.

**Independent Test**: Send messages → check disk for any persisted chat logs → verify none found → restart server → verify previous conversation not recoverable from memory or disk.

**Acceptance Scenarios**:

1. **Given** user sends chat message, **When** response streams back, **Then** message is sent ONLY to configured AI provider API
2. **Given** active chat session, **When** user inspects filesystem, **Then** no chat log files exist outside of explicitly saved notes
3. **Given** server restarts, **When** user checks session state, **Then** prior conversation history is completely cleared from memory
4. **Given** error occurs during chat, **When** error is logged, **Then** log contains NO user message content or AI response text

---

### User Story 3 - One-Click Note Summarization & Knowledge Base (Priority: P2)

During or after a conversation, user clicks a "Save as Note" button. The system generates a structured summary (title, key points, tags, visualization references) and stores it in a local SQLite knowledge base. User can browse, search, export (Markdown), and delete notes from within the web UI.

**Why this priority**: Core value-add beyond basic chat; enables the "personal knowledge base" vision. Depends on US1 (config) being functional but not on US2 (privacy).

**Independent Test**: Have a conversation → click "Save as Note" → note appears in sidebar/knowledge panel → search for note by keyword → export note as Markdown → delete note → confirm removed from SQLite.

**Acceptance Scenarios**:

1. **Given** active conversation with visualizations, **When** user clicks "Save as Note", **Then** system generates summary with title, key points, visualization HTML snippets, and tags
2. **Given** note saved, **When** user opens knowledge base panel, **Then** note appears in list with title, date, and tag badges
3. **Given** multiple notes saved, **When** user searches by keyword, **Then** matching notes are filtered in real-time
4. **Given** selected note, **When** user clicks "Export Markdown", **Then** downloadable .md file is generated
5. **Given** note deleted, **When** user refreshes knowledge panel, **Then** note is removed from both UI and SQLite database

---

### User Story 4 - Multi-Backend Support (Priority: P2)

User can choose between Claude Code (local) and Obsidian as AI backend targets via the setup wizard or config file. The backend abstraction layer routes requests appropriately. Frontend and visualization logic remain unchanged regardless of backend choice.

**Why this priority**: Enables ecosystem flexibility per Constitution VIII. Can be developed alongside US3 since they share the backend refactoring effort.

**Independent Test**: Configure backend=claude_code → chat works normally → change config to backend=obsidian → chat still works (if Obsidian plugin available) → frontend behavior identical.

**Acceptance Scenarios**:

1. **Given** config has `backend: "claude_code"`, **When** chat request made, **Then** request routed through Anthropic-compatible client
2. **Given** config has `backend: "obsidian"`, **When** chat request made, **Then** request routed through Obsidian adapter (if available)
3. **Given** unknown backend value in config, **When** server starts, **Then** clear error message shown and server does not start
4. **Given** backend switched, **When** frontend renders, **Then** visualization rendering, theme support, and streaming behavior are identical

---

### Edge Cases

- What happens when config file is corrupted JSON?
- What happens when API key is invalid or expired mid-session?
- What happens when SQLite database file is locked or corrupted?
- What happens when user interrupts setup wizard (Ctrl+C)?
- What happens when disk is full during note save?
- What happens when `~/.visualknowledge/` directory cannot be created?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST read configuration from `~/.visualknowledge/config.json` at startup
- **FR-002**: System MUST provide interactive terminal setup wizard when config file does not exist
- **FR-003**: System MUST accept environment variable overrides for all config values (higher priority than config file)
- **FR-004**: System MUST NOT persist chat conversation history to disk under any circumstance
- **FR-005**: System MUST NOT include user message content or AI responses in server-side log output
- **FR-006**: System MUST store user-saved notes in a local SQLite database
- **FR-007**: System MUST provide note CRUD operations (create, read, list, search, delete, export)
- **FR-008**: System MUST generate structured note summaries including title, key points, tags, and visualization references
- **FR-009**: System MUST implement pluggable backend adapter interface supporting at least Claude Code backend
- **FR-010**: System MUST validate config file integrity on startup and report actionable errors
- **FR-011**: System MUST support Markdown export of individual notes
- **FR-012**: System MUST provide REST API endpoints for note operations (`GET/POST/DELETE /api/notes`)
- **FR-013**: System MUST enforce git commit before skill/prompt file modifications (via pre-hook or documentation gate)

### Key Entities

- **Config**: API key (encrypted-at-rest optional), base URL, model name, backend type, port, preferences
- **Note**: id, title, content (Markdown), summary, tags (JSON array), visualization_snippets (JSON array), created_at, updated_at
- **ChatSession**: In-memory only — messages list, model used, timestamp range (NEVER persisted)
- **BackendAdapter**: Abstract interface — `stream_chat(messages, model, system_prompt)` → SSE generator

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero chat data written to disk except user-explicitly-saved notes
- **SC-002**: First-time setup completes in under 60 seconds with zero manual file editing
- **SC-003**: Note save-to-knowledge-base operation completes in under 2 seconds
- **SC-004**: Full-text search across notes returns results in under 200ms for <1000 notes
- **SC-005**: Server startup time with existing config under 3 seconds
- **SC-006**: All existing visualization functionality (HTML/Mermaid/SVG) continues working unchanged after refactor

## Assumptions

- Python 3.10+ available on user machine (for match/case syntax if needed)
- User has write access to home directory (`~/`)
- SQLite3 available (Python stdlib `sqlite3`)
- Existing Anthropic SDK (`anthropic` package) remains primary dependency
- Obsidian integration may be stubbed/placeholder initially with full implementation deferred
- Users understand basic terminal interaction (for setup wizard)
- Browser supports EventSource API (all modern browsers do)
