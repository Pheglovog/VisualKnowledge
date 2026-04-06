# Research: Constitution Alignment v1.1.0

**Feature**: `001-constitution-alignment`
**Date**: 2026-04-06
**Status**: Complete

## Research Topics & Decisions

### R1: Config File Format & Location

**Question**: What format and exact path for user-local configuration?

**Decision**: JSON format at `~/.visualknowledge/config.json`

**Rationale**:
- JSON is human-readable, editable with any text editor, and natively supported by Python stdlib (`json` module)
- `~/.visualknowledge/` follows XDG-like convention for app-specific config directories
- Single file keeps setup simple — no need for a directory of config fragments
- JSON schema is simple enough that validation can be done inline without a schema library

**Alternatives considered**:
- YAML: More readable but requires `pyyaml` dependency (violates minimal-deps constraint)
- TOML: Python 3.11+ `tomllib`, but limits Python version compatibility
- INI/configparser: No nested structure support; awkward for the data shape we need
- Environment-only: Current approach; rejected per Constitution III requirement for persisted local config

**Config Schema**:
```json
{
  "api_key": "sk-...",
  "base_url": "https://open.bigmodel.cn/api/anthropic",
  "model": "GLM-5V-Turbo",
  "backend": "claude_code",
  "port": 5000,
  "preferences": {
    "theme": "auto",
    "default_visualization": "html"
  }
}
```

---

### R2: Setup Wizard Implementation

**Question**: How to implement interactive first-time setup?

**Decision**: Terminal-based interactive prompt using `input()` with step-by-step flow

**Rationale**:
- Server is already a terminal application (runs via `python server.py`)
- No GUI toolkit needed; keeps dependencies minimal
- Can be non-interactive in headless/Docker scenarios by pre-creating config file
- `getpass.getpass()` available for secure API key input (masked)

**Flow**:
```
1. Check if ~/.visualknowledge/config.json exists → YES: load silently, DONE
2. NO: Print welcome banner
3. Prompt: API Key (masked input)
4. Prompt: Base URL (with default)
5. Prompt: Model name (with default)
6. Prompt: Backend type (claude_code / obsidian) (with default)
7. Validate inputs (URL format, non-empty key)
8. Create ~/.visualknowledge/ directory
9. Write config.json with proper permissions (chmod 600 on Unix)
10. Confirm success to user
```

**Alternatives considered**:
- Web-based setup page: Adds complexity; requires server running before config exists (chicken-and-egg)
- CLI flags only: Less discoverable; no guided experience

---

### R3: Privacy Architecture — Session Memory Model

**Question**: How to ensure chat data never touches disk while maintaining streaming functionality?

**Decision**: In-memory session store using Python dict, scoped per connected client

**Rationale**:
- Flask's development server handles one request at a time (threading mode); session dict in module scope suffices
- SSE streaming already works with generators — no need to buffer full responses to disk
- On restart, Python process memory is reclaimed by OS — zero cleanup code needed
- Logging must be explicitly sanitized: log request metadata (timestamp, model, token count) but NEVER message content

**Implementation notes**:
- `server.py` logger: set level to WARNING for production; INFO messages MUST exclude message bodies
- Error handling: catch exceptions, log error type + message but NOT user input or AI output
- The `full_response` variable in current `generate()` function should be removed or used only for metrics (length count), not logged with content

**Alternatives considered**:
- Encrypted disk storage: Over-engineering; violates "no persistence" principle
- Redis/memcached: External dependency; unnecessary for single-user local app

---

### R4: Knowledge Base — SQLite Schema Design

**Question**: What SQLite schema for notes with search, tags, and visualization snippets?

**Decision**: Two-table design: `notes` + `tags` with many-to-many via `note_tags`

**Schema**:

```sql
CREATE TABLE IF NOT EXISTS notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,           -- Full Markdown content
    summary     TEXT,                    -- AI-generated summary
    source_model TEXT,                   -- Which model generated this conversation
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tags (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS note_tags (
    note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
    tag_id  INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

-- FTS5 full-text search virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    title, content, summary,
    content=notes, content_rowid=id
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, content, summary)
    VALUES (new.id, new.title, new.content, new.summary);
END;

CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content, summary)
    VALUES ('delete', old.id, old.title, old.content, old.summary);
END;

CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content, summary)
    VALUES ('delete', old.id, old.title, old.content, old.summary);
    INSERT INTO notes_fts(rowid, title, content, summary)
    VALUES (new.id, new.title, new.content, new.summary);
END;
```

**Rationale**:
- FTS5 provides fast full-text search (<200ms target) natively in SQLite
- Many-to-many tags allow flexible categorization without tag duplication
- Triggers keep search index auto-synced — no manual reindexing needed
- `visualization_snippets` stored as HTML within `content` field (no separate column needed — keeps schema simple)

**Database location**: `~/.visualknowledge/knowledge.db`

**Alternatives considered**:
- JSON file storage: Poor search performance; no indexing; concurrent access issues
- Single-table with JSON tags: Slower tag queries; no tag normalization

---

### R5: Backend Adapter Pattern

**Question**: How to abstract AI backend calls for multi-provider support?

**Decision**: Abstract base class with registry pattern, concrete adapters per backend

**Interface**:
```python
class BackendAdapter(ABC):
    @abstractmethod
    def stream_chat(self, messages: list, model: str, system_prompt: str) -> Generator[dict, None, None]:
        """Yield SSE-compatible dicts: {'type': 'text'|'error', 'content': str}"""
        ...

    @abstractmethod
    def list_models(self) -> list[str]:
        """Return available model names"""
        ...

    @classmethod
    @abstractmethod
    def name(cls) -> str:
        """Unique backend identifier string"""
        ...
```

**Registry**:
```python
BACKEND_REGISTRY: dict[str, type[BackendAdapter]] = {}

def register_backend(cls):
    BACKEND_REGISTRY[cls.name()] = cls
    return cls

def get_backend(name: str) -> BackendAdapter:
    """Factory: resolve backend by name from config"""
    ...
```

**Claude Code adapter**: Extract existing `anthropic.Anthropic` client usage from `server.py` into `claude_adapter.py`. Uses `anthropic` SDK, streams via `client.messages.stream()`.

**Obsidian adapter**: Stub implementation that raises `NotImplementedError` with clear message. Future implementation would use Obsidian's Local REST API or plugin protocol.

**Rationale**:
- Adapter pattern cleanly separates provider-specific logic from core server
- Registry enables runtime selection from config value
- Stub for Obsidian allows architecture to be correct without full implementation
- Frontend unchanged — server.py just calls `backend.stream_chat()`

**Alternatives considered**:
- If/else branching in server.py: Violates open/closed principle; hard to test
- Function-based dispatch: Less structured; no shared interface contract
- Separate processes per backend: Over-engineering for local tool

---

### R6: Note Summarization Strategy

**Question**: How does "one-click note summarization" work technically?

**Decision**: When user clicks "Save as Note", frontend sends the conversation context to a dedicated `/api/notes` endpoint. The backend calls the AI provider with a summarization system prompt (separate from chat prompt) to generate: title, summary bullet points, suggested tags, and formatted Markdown with embedded visualizations.

**Implementation approach**:
1. Frontend collects: current conversation messages + rendered visualization HTML snippets
2. POST to `/api/notes` with `{messages: [...], visualizations: [...]}`
3. Backend constructs a summarization prompt asking AI to produce structured output
4. Backend calls `backend.stream_chat()` with summarization prompt (non-streaming mode acceptable here since it's a background operation)
5. Parse structured output → insert into SQLite → return note ID
6. Frontend shows success notification + adds note to knowledge panel

**Rationale**: Leverages existing AI connection for summarization; no extra service needed. User already trusts this AI provider with their content (they're chatting with it). The summarization call is an additional API call to the same endpoint.

**Privacy consideration**: This IS an explicit user action ("Save as Note") — writing to SQLite is permitted per Principle VI which allows persistence for "user's explicit knowledge base save action".

---

### R7: Commit Discipline Enforcement

**Question**: How to enforce Principle VII (commit before skill/prompt changes)?

**Decision**: Documentation-first enforcement with optional git hook script

**Approach**:
1. Document in Development Workflow section of constitution (already done)
2. Add a comment block at top of `skills/visualize.py` and the SYSTEM_PROMPT area of `server.py` reminding developers to commit first
3. Provide an optional `.git/hooks/pre-modify.sh` script (not committed to repo, documented in README) that checks for uncommitted changes before allowing edits to watched files
4. In the plan workflow, add a gate check before Phase 2 task generation for skill modifications

**Rationale**: Hard enforcement via git hooks is fragile and platform-dependent. Cultural enforcement via documentation + clear reminders is more practical for a small project. The constitution's governance section already mandates compliance review.

---

## Resolved NEEDS CLARIFICATION Items

All technical unknowns from plan template have been resolved through research above. No remaining ambiguities.
