# API Docs

**Base URL:** `http://localhost:3000`

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat` | List all conversations |
| POST | `/chat` | Send a message (text or file) |
| GET | `/chat/:conversationId` | Get messages of a conversation |
| DELETE | `/chat/:conversationId` | Delete a conversation |
| POST | `/chat/docs` | Upload a document + ask a question |

---

## GET /chat — List Conversations

Returns all conversations (newest first) for the sidebar.

**Query params:** `?limit=20` (default 50, max 200)

```bash
curl http://localhost:3000/chat\?limit\=20
```

**Response 200:**
```json
{
  "items": [
    {
      "conversationId": "550e8400-...",
      "title": "What is AI?",
      "lastMessage": "AI is the field of...",
      "lastRole": "model",
      "lastMessageAt": "2026-03-18T10:00:00.000Z",
      "createdAt": "2026-03-18T09:58:00.000Z",
      "updatedAt": "2026-03-18T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## POST /chat — Send a Message

Send a text message or a file with a question. Supports JSON or `multipart/form-data`.

### Text (JSON)

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "conversationId": "optional-uuid"}'
```

**Body:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| message | string | Yes | Max 2000 chars |
| conversationId | string | No | Omit to start a new conversation |

### With File (multipart/form-data)

```bash
curl -X POST http://localhost:3000/chat \
  -F "files=@./document.pdf" \
  -F "message=Summarize this"
```

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| files (or file) | file | Yes | pdf, txt, md, json, csv — max 8MB |
| message | string | Yes | Question about the file |

**Response 200:**
```json
{
  "conversationId": "f47ac10b-...",
  "reply": "Hello! How can I help you?",
  "metadata": {
    "requestTime": 3245,
    "timestamp": "2026-03-18T15:30:45.123Z"
  }
}
```

---

## GET /chat/:conversationId — Get Conversation History

```bash
curl http://localhost:3000/chat/f47ac10b-...
```

**Response 200:**
```json
{
  "conversationId": "f47ac10b-...",
  "messages": [
    { "role": "user", "content": "Hello!" },
    { "role": "model", "content": "Hi! How can I help?" }
  ],
  "count": 2
}
```

**Response 404** — conversation not found:
```json
{
  "error": true,
  "status": 404,
  "message": "Conversation not found"
}
```

---

## DELETE /chat/:conversationId — Delete a Conversation

```bash
curl -X DELETE http://localhost:3000/chat/f47ac10b-...
```

**Response 200:**
```json
{ "message": "Conversation deleted" }
```

**Response 404** — conversation not found.

---

## POST /chat/docs — Upload Document + Ask Question

Upload a file and ask a question about its content.

```bash
curl -X POST http://localhost:3000/chat/docs \
  -F "file=@./report.pdf" \
  -F "message=What are the key points?"
```

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| file | file | Yes | pdf, txt, md, json, csv — max 8MB |
| message | string | Yes | Question about the document |

**Response 200:**
```json
{
  "conversationId": "550e8400-...",
  "fileName": "report.pdf",
  "reply": "The key points are...",
  "metadata": {
    "requestTime": 4120,
    "timestamp": "2026-03-18T16:00:00.000Z"
  }
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Validation error (missing field, unsupported file type) |
| 404 | Conversation not found |
| 413 | File exceeds 8MB |
| 429 | Gemini rate limit — wait ~1 min and retry |
| 500 | Server error / missing API key |
| 502 | Gemini API error |

All errors follow this shape:
```json
{
  "error": true,
  "status": 400,
  "message": "message is required and cannot be empty",
  "timestamp": "2026-03-18T15:30:45.123Z"
}
```
