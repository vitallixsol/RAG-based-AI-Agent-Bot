import Anthropic from '@anthropic-ai/sdk';
import { embedText } from './embedder';
import { searchChunks } from './vectorStore';
import { buildSystemPrompt } from './promptBuilder';
import { db } from '../db/database';
import { ChatMessage, ChatResponse, ChatSource } from '../types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const TOP_K = parseInt(process.env.RETRIEVAL_TOP_K || '5');
const MIN_SCORE = parseFloat(process.env.RETRIEVAL_MIN_SCORE || '0.3');

export async function ragQuery(query: string, history: ChatMessage[] = []): Promise<ChatResponse> {
  const startTime = Date.now();

  // 1. Embed query
  const queryEmbedding = await embedText(query);

  // 2. Retrieve chunks from MongoDB
  const allChunks = await db.getAllChunksEnriched();
  const retrievedChunks = searchChunks(queryEmbedding, allChunks, TOP_K, MIN_SCORE);

  // 3. Build augmented prompt
  const config = await db.getConfig();
  const { systemPrompt, hasContext } = buildSystemPrompt(config, retrievedChunks);

  // 4. Call Claude
  const messages = [
    ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: query },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const reply = response.content[0].type === 'text'
    ? response.content[0].text
    : config.fallbackMsg;

  // 5. Build sources
  const sources: ChatSource[] = retrievedChunks.map(c => ({
    entryId:    c.entryId,
    entryType:  c.entryType,
    entryTitle: c.entryTitle,
    score:      Math.round(c.score * 1000) / 1000,
    chunkIndex: c.chunkIndex,
  }));

  // 6. Log to MongoDB
  await db.insertLog({
    query, response: reply, sources,
    retrievedChunks: retrievedChunks.length,
    latencyMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });

  return { reply, sources, retrievedChunks: retrievedChunks.length, usedContext: hasContext };
}
