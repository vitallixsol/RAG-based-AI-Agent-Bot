# NeuralBase Backend — Full RAG Pipeline + MongoDB

Node.js + Express + TypeScript + **Mongoose (MongoDB)** backend with a complete RAG pipeline.

## Why MongoDB?

✅ Pure JavaScript driver — **no native compilation, no Visual Studio needed**
✅ Works on Windows / Mac / Linux out of the box
✅ Documents map naturally to KnowledgeEntry JSON
✅ Atlas-ready: swap `MONGODB_URI` to scale instantly
✅ Atlas Vector Search: future upgrade path to push cosine similarity into the DB

---

## Quick Start

### 1. Install MongoDB

**Option A — Local (free)**
Download from https://www.mongodb.com/try/download/community
Default URI: `mongodb://localhost:27017/neuralbase`

**Option B — MongoDB Atlas (free tier, no install)**
1. Create account at https://cloud.mongodb.com
2. Create free M0 cluster
3. Get connection string → paste into `.env`

### 2. Run the server

```bash
cd backend
npm install          # no native compilation!
cp .env.example .env  # fill in API keys + MONGODB_URI
npm run dev          # → http://localhost:3001
```

---

## Project Structure

```
backend/src/
├── index.ts                    # Bootstrap: connectDB → Express
├── types.ts                    # TypeScript interfaces
│
├── db/
│   ├── connection.ts           # Mongoose connect/disconnect + graceful shutdown
│   ├── models.ts               # Mongoose schemas: KnowledgeEntry, Chunk, QueryLog, AppConfig
│   ├── database.ts             # High-level DB service (all queries live here)
│   ├── seed.ts                 # npm run db:seed — creates default config doc
│   └── reset.ts                # npm run db:reset — drops all collections
│
├── rag/
│   ├── chunker.ts              # Sliding-window text splitter
│   ├── embedder.ts             # OpenAI text-embedding-3-small
│   ├── vectorStore.ts          # In-process cosine similarity search
│   ├── ingestion.ts            # chunk → embed → store pipeline
│   ├── promptBuilder.ts        # Grounded prompt construction
│   ├── pipeline.ts             # End-to-end RAG query orchestrator
│   └── documentParser.ts       # PDF / TXT / MD / CSV / JSON parser
│
├── routes/
│   ├── knowledge.ts            # CRUD + auto-ingest on create/update
│   ├── chat.ts                 # POST /api/chat — RAG query endpoint
│   ├── ingest.ts               # Reindex + file upload
│   ├── config.ts               # App settings
│   └── logs.ts                 # Query audit logs
│
└── middleware/
    └── errorHandler.ts         # Global error handler + asyncHandler wrapper
```

---

## MongoDB Collections

| Collection | Purpose |
|---|---|
| `knowledgeentries` | Source documents, FAQs, policies |
| `chunks` | Text chunks + 1536-dim float[] embeddings |
| `querylogs` | Every chat query with sources + latency |
| `appconfigs` | Single-document app settings |

---

## RAG Pipeline

```
User query
  ↓ embedText()              OpenAI API → 1536-dim vector
  ↓ getAllChunksEnriched()   MongoDB aggregate (chunks JOIN entries)
  ↓ searchChunks()           Cosine similarity, top-K, deduplicated
  ↓ buildSystemPrompt()      Inject retrieved chunks with scores
  ↓ claude.messages()        Claude generates grounded answer
  ↓ insertLog()              Save query + sources to MongoDB
  → ChatResponse             reply + sources + metadata
```

---

## Atlas Vector Search (future upgrade)

When you're on Atlas M10+, you can push similarity search into MongoDB:

```javascript
// Atlas Vector Search index definition (create in Atlas UI)
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 1536,
    "similarity": "cosine"
  }]
}

// Then replace vectorStore.ts with:
await ChunkModel.aggregate([{
  $vectorSearch: {
    index: "embedding_index",
    path: "embedding",
    queryVector: queryEmbedding,
    numCandidates: 100,
    limit: 5,
  }
}]);
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health + RAG stats |
| GET/POST/PUT/DELETE | `/api/knowledge` | CRUD (auto-embeds on write) |
| POST | `/api/chat` | `{ query, history[] }` → RAG reply + sources |
| POST | `/api/ingest/reindex` | Re-embed pending/failed entries |
| POST | `/api/ingest/reindex-all` | Full re-embed |
| POST | `/api/ingest/upload` | Upload PDF/TXT/MD/CSV/JSON |
| GET/PUT | `/api/config` | App settings |
| GET/DELETE | `/api/logs` | Query audit logs |

---

## npm Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm run start        # Run compiled JS
npm run db:seed      # Create default config document
npm run db:reset     # Drop all collections
```
