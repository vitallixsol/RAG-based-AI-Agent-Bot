/**
 * rag/embedder.ts
 *
 * Generates dense vector embeddings using OpenAI's text-embedding-3-small
 * (1536 dimensions, cheap and fast).
 *
 * Batching: OpenAI allows up to 2048 inputs per request.
 * We batch in groups of 100 to stay well within limits.
 *
 * To swap providers:
 *   - Cohere: use cohere.embed({ texts, model: 'embed-english-v3.0' })
 *   - Voyage: use voyageai.embed({ input: texts, model: 'voyage-2' })
 *   - Local: run ollama nomic-embed-text and call its HTTP endpoint
 */

import OpenAI from 'openai';

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS || '1536');
const BATCH_SIZE = 100;

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set. Add it to your .env file.');
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Embed a single text string.
 */
export async function embedText(text: string): Promise<number[]> {
  const results = await embedBatch([text]);
  return results[0];
}

/**
 * Embed multiple texts in batches.
 * Returns an array of embedding vectors in the same order as input.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getClient();
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    // Sanitize: replace newlines (OpenAI recommendation)
    const sanitized = batch.map(t => t.replace(/\n+/g, ' ').trim());

    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: sanitized,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    // Sort by index to maintain order
    const sorted = response.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map(item => item.embedding));
  }

  return allEmbeddings;
}

/**
 * Returns embedding model info for health checks.
 */
export function getEmbeddingInfo() {
  return {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    provider: 'openai',
  };
}
