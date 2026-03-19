# AI Chat Backend

Backend API for chat with Gemini, document Q&A, and persistent chat history in MySQL.

## 1. Prerequisites

- Node.js >= 18
- npm
- Docker + Docker Compose
- Gemini API key

Check quickly:

```bash
node -v
npm -v
docker -v
docker-compose -v
```

## 2. Environment Setup

Create env file:

```bash
cp .env.example .env
```

Update `.env` values (minimum required):

```bash
GEMINI_API_KEY=your_real_key
DATABASE_URL=mysql://user:password@localhost:3307/chat_db
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
```

Notes:

- This project maps MySQL container to host port `3307` to avoid conflict with local MySQL/MariaDB on `3306`.
- If your machine does not use `3306`, you can switch back to `3306` in both `docker-compose.yml` and `.env`.

## 3. Install Dependencies

```bash
npm install
```

## 4. Start Database

Run MySQL service from docker-compose:

```bash
docker-compose up -d db
```

Check DB is up:

```bash
docker ps | grep ai-chat-backend-db-1
```

## 5. Start Backend API

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

When startup is successful, you should see logs similar to:

```text
[✓] Database schema ready
[✓] Server running on http://localhost:3000
[✓] Persistence: MySQL enabled
```

## 6. Smoke Test API

### 6.1 Create or continue chat

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

### 6.2 List history items (for FE sidebar)

```bash
curl "http://localhost:3000/chat?limit=20"
```

### 6.3 Load one conversation detail

```bash
curl "http://localhost:3000/chat/<conversationId>"
```

### 6.4 Delete one conversation history item

```bash
curl -X DELETE "http://localhost:3000/chat/<conversationId>"
```

### 6.5 Ask from document

```bash
curl -X POST http://localhost:3000/chat \
  -F "files=@./sample.pdf" \
  -F "message=File này nói gì?"
```

## 7. Stop Services

Stop API: `Ctrl + C` in terminal running node.

Stop database:

```bash
docker-compose stop db
```

Remove DB container (keep volume data):

```bash
docker-compose rm -f db
```

Remove DB container + volume data (hard reset):

```bash
docker-compose down -v
```

## 8. Common Issues

Port 3000 already in use:

```bash
lsof -ti:3000 | xargs kill -9
```

DB port conflict:

- If `docker-compose up -d db` fails because `3306` is in use, keep using `3307` config as provided.

Gemini 429 rate limit:

- Wait 1-2 minutes and retry.

## 9. Core Endpoints

- `POST /chat` (json or multipart)
- `GET /chat` (list histories)
- `GET /chat/:conversationId` (conversation detail)
- `DELETE /chat/:conversationId` (delete history item)
- `POST /chat/docs` (alternate doc upload endpoint)