import { db } from '../db/database';
import { chunkEntry } from './chunker';
import { embedBatch } from './embedder';
import { Chunk, KnowledgeEntry, IngestResult } from '../types';

export async function ingestEntry(entry: KnowledgeEntry): Promise<IngestResult> {
  const start = Date.now();
  try {
    await db.deleteChunksByEntry(entry.id);
    const textChunks = chunkEntry(entry.question, entry.answer);
    if (textChunks.length === 0) {
      await db.updateEntry(entry.id, { embedStatus: 'failed', chunkCount: 0 });
      throw new Error('No chunks generated — entry may be empty');
    }
    const embeddings = await embedBatch(textChunks.map(c => c.content));
    const now = new Date().toISOString();
    const chunks: Chunk[] = textChunks.map((tc, i) => ({
      id: `${entry.id}-${i}`,
      entryId: entry.id,
      chunkIndex: tc.chunkIndex,
      content: tc.content,
      embedding: embeddings[i],
      tokenCount: tc.tokenCount,
      createdAt: now,
    }));
    await db.insertChunksBatch(chunks);
    await db.updateEntry(entry.id, { embedStatus: 'embedded', chunkCount: chunks.length });
    return { entryId: entry.id, chunksCreated: chunks.length, embeddingsGenerated: embeddings.length, durationMs: Date.now() - start };
  } catch (err) {
    await db.updateEntry(entry.id, { embedStatus: 'failed', chunkCount: 0 });
    throw err;
  }
}

export async function reindexPending() {
  const start = Date.now();
  const entries = (await db.getAllEntries()).filter(e => e.embedStatus !== 'embedded');
  let succeeded = 0, failed = 0, totalChunks = 0;
  for (const entry of entries) {
    try {
      const result = await ingestEntry(entry);
      succeeded++; totalChunks += result.chunksCreated;
    } catch { failed++; }
  }
  return { processed: entries.length, succeeded, failed, totalChunks, durationMs: Date.now() - start };
}

export async function reindexAll() {
  const start = Date.now();
  const entries = await db.getAllEntries();
  for (const e of entries) await db.updateEntry(e.id, { embedStatus: 'pending', chunkCount: 0 });
  let succeeded = 0, failed = 0, totalChunks = 0;
  for (const entry of entries) {
    try {
      const result = await ingestEntry(entry);
      succeeded++; totalChunks += result.chunksCreated;
    } catch { failed++; }
  }
  await db.setLastTrained();
  return { processed: entries.length, succeeded, failed, totalChunks, durationMs: Date.now() - start };
}
