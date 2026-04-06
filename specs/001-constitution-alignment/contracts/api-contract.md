# API Contract: VisualKnowledge v1.1.0

**Feature**: `001-constitution-alignment`
**Date**: 2026-04-06
**Protocol**: HTTP + JSON (REST) / SSE (streaming)

## Existing Endpoints (Preserved)

### `GET /`

Serve `index.html` (SPA entry point). Cache-control: no-cache.

**Response**: `text/html` — The single-page application

---

### `GET /api/models`

List available AI models.

**Response**: `application/json`
```json
{
  "current": "GLM-5V-Turbo",
  "available": ["GLM-5V-Turbo", "GLM-4.5-air", "GLM-5.1"]
}
```

---

### `POST /api/chat`

Stream chat response via SSE.

**Request**: `application/json`
```json
{
  "messages": [
    {"role": "user", "content": "Explain attention mechanism"}
  ],
  "model": "GLM-5V-Turbo"
}
```

**Response**: `text/event-stream` (SSE)
```
data: {"type":"text","content":"Here"}\n\n
data: {"type":"text","content":"'s"}\n\n
...
data: [DONE]\n\n
```

**Error event**: `{"type":"error","message":"..."}`

**Privacy contract**: Request body and response content MUST NOT be logged server-side.

---

## New Endpoints (Constitution Alignment)

### `GET /api/notes`

List all notes, with optional search filtering.

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `q` | string | No | `""` | Full-text search query (searches title, content, summary) |
| `tag` | string | No | — | Filter by tag name |
| `limit` | integer | No | `50` | Max results to return |
| `offset` | integer | No | `0` | Pagination offset |

**Response**: `application/json` (200)
```json
{
  "notes": [
    {
      "id": 1,
      "title": "Transformer Architecture Explained",
      "summary": "- Multi-head self-attention is the core innovation...",
      "tags": ["deep-learning", "transformer", "attention"],
      "source_model": "GLM-5V-Turbo",
      "created_at": "2026-04-06T10:30:00",
      "updated_at": "2026-04-06T10:30:00"
    }
  ],
  "total": 1,
  "query": ""
}
```

**Errors**: 500 (database error)

---

### `POST /api/notes`

Create a new note from conversation context (one-click save + summarization).

**Request**: `application/json`
```json
{
  "messages": [
    {"role": "user", "content": "Explain transformer"},
    {"role": "assistant", "content": "..."}
  ],
  "visualizations": ["<div>...</div>"]
}
```

**Processing flow**:
1. Validate request has at least one message pair
2. Call AI backend with **summarization prompt** (not chat prompt) to generate:
   - Title (concise, <80 chars)
   - Summary (3-5 bullet points)
   - Suggested tags (3-5 keywords)
   - Formatted Markdown with embedded visualization HTML
3. Insert into SQLite `notes` table + resolve/create tags
4. Return created note

**Response**: `application/json` (201)
```json
{
  "id": 1,
  "title": "Transformer Architecture Explained",
  "summary": "- Multi-head self-attention...",
  "content": "# Transformer Architecture\n\n...",
  "tags": ["deep-learning", "transformer"],
  "created_at": "2026-04-06T10:30:00"
}
```

**Errors**:
- 400: Empty messages or invalid request body
- 500: AI summarization failure or database error

**Privacy note**: This endpoint writes to disk by explicit user action (Save as Note button click) — permitted per Principle VI.

---

### `GET /api/notes/{id}`

Retrieve a single note by ID, with full content.

**Response**: `application/json` (200)
```json
{
  "id": 1,
  "title": "Transformer Architecture Explained",
  "content": "# Transformer Architecture\n\n<div>...</div>\n\n## Summary\n\n- ...",
  "summary": "- Multi-head self-attention...",
  "tags": ["deep-learning", "transformer"],
  "source_model": "GLM-5V-Turbo",
  "created_at": "2026-04-06T10:30:00",
  "updated_at": "2026-04-06T10:30:00"
}
```

**Errors**: 404 (note not found), 500 (database error)

---

### `GET /api/notes/{id}?format=markdown`

Export a single note as downloadable Markdown file.

**Response**: `text/markdown; charset=utf-8` (200)
```
Content-Disposition: attachment; filename="transformer-architecture-explained.md"

# Transformer Architecture Explained

[Full Markdown content]
```

**Errors**: 404 (note not found)

---

### `DELETE /api/notes/{id}`

Delete a note by ID (cascade deletes tag associations).

**Response**: `application/json` (200)
```json
{
  "deleted": true,
  "id": 1
}
```

**Errors**: 404 (note not found), 500 (database error)

---

### `GET /api/tags`

List all tags with usage counts.

**Response**: `application/json` (200)
```json
{
  "tags": [
    {"name": "deep-learning", "count": 5},
    {"name": "transformer", "count": 3},
    {"name": "attention", "count": 2}
  ]
}
```

---

### `GET /api/config/status`

Return (sanitized) config status for frontend display. NEVER returns api_key.

**Response**: `application/json` (200)
```json
{
  "configured": true,
  "backend": "claude_code",
  "model": "GLM-5V-Turbo",
  "base_url": "https://open.bigmodel.cn/api/anthropic",
  "config_path": "/home/user/.visualknowledge/config.json"
}
```

**Privacy contract**: This endpoint MUST NOT include `api_key` or any secret value in its response.

---

## SSE Event Protocol (Preserved & Extended)

| Event Type | Structure | Description |
|------------|-----------|-------------|
| `text` | `{"type":"text","content":"..."}` | Content delta token |
| `error` | `{"type":"error","message":"..."}` | Error information |
| `[DONE]` | `data: [DONE]\n\n` | Stream end signal |
| `note_saved` *(new)* | `{"type":"note_saved","note_id":1,"title":"..."}` | Note creation confirmation (sent after POST /api/notes completes) |

## Error Response Format (All endpoints)

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"  // e.g., "CONFIG_MISSING", "API_KEY_INVALID", "DB_ERROR"
}
```
