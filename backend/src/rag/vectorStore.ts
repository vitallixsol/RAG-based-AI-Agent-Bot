/**
 * rag/vectorStore.ts — in-process cosine similarity search.
 * 
 * Receives pre-fetched chunks from MongoDB, scores them, returns top-K.
 * Scale-up: use MongoDB Atlas Vector Search ($vectorSearch) to push
 * the similarity computation into the database itself — no code change
 * needed in the rest of the app, just swap this function.
 */
import { RetrievedChunk, KnowledgeType } from '../types';

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function searchChunks(
  queryEmbedding: number[],
  chunks: { id: string; entryId: string; chunkIndex: number; content: string; embedding: number[]; entryType: KnowledgeType; entryTitle: string }[],
  topK = 5,
  minScore = 0.3,
): RetrievedChunk[] {
  if (chunks.length === 0) return [];

  const scored = chunks
    .map(c => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score);

  // Best chunk per entry first, then fill remaining slots
  const seen = new Set<string>();
  const deduped: RetrievedChunk[] = [];
  for (const r of scored) {
    if (deduped.length >= topK) break;
    if (!seen.has(r.entryId)) {
      seen.add(r.entryId);
      deduped.push({ chunkId: r.id, entryId: r.entryId, entryType: r.entryType, entryTitle: r.entryTitle, chunkIndex: r.chunkIndex, content: r.content, score: r.score });
    }
  }
  for (const r of scored) {
    if (deduped.length >= topK) break;
    if (!deduped.find(d => d.chunkId === r.id)) {
      deduped.push({ chunkId: r.id, entryId: r.entryId, entryType: r.entryType, entryTitle: r.entryTitle, chunkIndex: r.chunkIndex, content: r.content, score: r.score });
    }
  }
  return deduped.slice(0, topK);
}
