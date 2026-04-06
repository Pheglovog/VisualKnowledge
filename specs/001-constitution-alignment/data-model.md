# Data Model: Constitution Alignment v1.1.0

**Feature**: `001-constitution-alignment`
**Date**: 2026-04-06

## Entities

### Config (User-Local, NOT in repository)

Stored at: `~/.visualknowledge/config.json`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `api_key` | string | YES | — | AI provider API key (written by setup wizard) |
| `base_url` | string | YES | `https://open.bigmodel.cn/api/anthropic` | API endpoint URL |
| `model` | string | YES | `GLM-5V-Turbo` | Default model identifier |
| `backend` | string | YES | `claude_code` | Backend adapter name (`claude_code` or `obsidian`) |
| `port` | integer | NO | `5000` | Server listen port |
| `preferences.theme` | string | NO | `auto` | UI theme preference |
| `preferences.default_visualization` | string | NO | `html` | Default viz type for AI responses |

**Validation rules**:
- `api_key`: non-empty string, min 10 characters
- `base_url`: valid URL format (https:// required)
- `model`: non-empty string
- `backend`: must be in `BACKEND_REGISTRY` keys
- `port`: 1024-65535 range
- File permissions: `0600` (owner read/write only) on Unix systems

---

### Note (SQLite: `notes` table)

Database: `~/.visualknowledge/knowledge.db`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique note identifier |
| `title` | TEXT | NOT NULL | AI-generated or user-edited title |
| `content` | TEXT | NOT NULL | Full Markdown content with embedded visualization HTML |
| `summary` | TEXT | NULLABLE | AI-generated bullet-point summary |
| `source_model` | TEXT | NULLABLE | Model used when note was created |
| `created_at` | TEXT | NOT NULL, DEFAULT `datetime('now')` | ISO 8601 creation timestamp |
| `updated_at` | TEXT | NOT NULL, DEFAULT `datetime('now')` | ISO 8601 last-modified timestamp |

**State transitions**:
```
CREATED (via /api/notes POST) → ACTIVE → UPDATED (via PUT) → DELETED (via DELETE)
                                                    ↘ EXPORTED (via GET?format=md)
```

---

### Tag (SQLite: `tags` table)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique tag identifier |
| `name` | TEXT | NOT NULL, UNIQUE | Tag display name (case-preserved, unique) |

---

### NoteTag (SQLite: `note_tags` table — many-to-many join)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `note_id` | INTEGER | FK → notes(id), ON DELETE CASCADE | Reference to note |
| `tag_id` | INTEGER | FK → tags(id), ON DELETE CASCADE | Reference to tag |
| **PK** | (note_id, tag_id) | PRIMARY KEY | Composite key |

---

### ChatSession (In-Memory ONLY, never persisted)

| Field | Type | Description |
|-------|------|-------------|
| `messages` | list[dict] | Conversation message history (role + content) |
| `model` | str | Model used for this session |
| `created_at` | datetime | Session start time |

**Lifecycle**: Created on first chat request of a session. Exists only in Python process memory. Destroyed on server restart/process exit. NEVER written to disk, database, or log files.

---

### BackendAdapter (Python abstract class)

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `stream_chat` | `(messages, model, system_prompt)` | `Generator[dict]` | Stream SSE events for chat |
| `list_models` | `()` -> `list[str]` | Available model names | List models for this backend |
| `name` | `() -> str` (classmethod) | Backend identifier string | Registry key (e.g., `"claude_code"`) |

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────┐       ┌──────────────┐
│    notes     │──────<│note_tags │>──────│    tags      │
├──────────────┤       ├──────────┤       ├──────────────┤
│ id (PK)      │       │ note_id  │       │ id (PK)      │
│ title        │       │ tag_id   │       │ name (UNIQUE)│
│ content      │       └──────────┘       └──────────────┘
│ summary      │
│ source_model │       ┌──────────────────────────────┐
│ created_at   │       │     notes_fts (FTS5 virtual)  │
│ updated_at   │       │  title, content, summary      │
└──────────────┘       │  auto-synced via triggers     │
                       └──────────────────────────────┘

  ~config.json          ~knowledge.db           In-memory only
  (user-local file)     (SQLite DB)             (ChatSession)
```
