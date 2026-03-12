// ── Knowledge Entry ────────────────────────────────────────────────────────
export type KnowledgeType = 'faq' | 'product' | 'policy' | 'general' | 'document';
export type Priority = 'high' | 'normal' | 'low';
export type EmbedStatus = 'pending' | 'embedded' | 'failed';

export interface KnowledgeEntry {
  id: string;
  type: KnowledgeType;
  question: string;       // title / topic
  answer: string;         // full content
  tags: string[];
  priority: Priority;
  sourceFile?: string;    // original filename if uploaded
  embedStatus: EmbedStatus;
  chunkCount: number;     // number of chunks generated
  createdAt: string;
  updatedAt: string;
}

// ── RAG Chunk ──────────────────────────────────────────────────────────────
export interface Chunk {
  id: string;
  entryId: string;        // parent knowledge entry
  chunkIndex: number;     // position within the entry
  content: string;        // raw text of this chunk
  embedding: number[];    // vector (float[])
  tokenCount: number;
  createdAt: string;
}

// ── Retrieval ──────────────────────────────────────────────────────────────
export interface RetrievedChunk {
  chunkId: string;
  entryId: string;
  entryType: KnowledgeType;
  entryTitle: string;
  chunkIndex: number;
  content: string;
  score: number;          // cosine similarity 0-1
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  query: string;
  retrievedAt: string;
}

// ── App Config ─────────────────────────────────────────────────────────────
export interface AppConfig {
  companyName: string;
  systemPrompt: string;
  fallbackMsg: string;
  chatbotTitle: string;
  welcomeMsg: string;
  primaryColor: string;
  lastTrained: string | null;
  totalChunks: number;
  totalEmbeddings: number;
}

// ── Chat ───────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSource {
  entryId: string;
  entryType: KnowledgeType;
  entryTitle: string;
  score: number;
  chunkIndex: number;
}

export interface ChatResponse {
  reply: string;
  sources: ChatSource[];
  retrievedChunks: number;
  usedContext: boolean;
}

// ── Query Log ──────────────────────────────────────────────────────────────
export interface QueryLog {
  id: string;
  query: string;
  response: string;
  sources: ChatSource[];
  retrievedChunks: number;
  latencyMs: number;
  timestamp: string;
}

// ── Ingestion ──────────────────────────────────────────────────────────────
export interface IngestResult {
  entryId: string;
  chunksCreated: number;
  embeddingsGenerated: number;
  durationMs: number;
}

// ── Stats ──────────────────────────────────────────────────────────────────
export interface Stats {
  total: number;
  embedded: number;
  pending: number;
  failed: number;
  categories: number;
  byType: Record<KnowledgeType, number>;
  totalChunks: number;
  todayQueries: number;
  lastTrained: string | null;
}
