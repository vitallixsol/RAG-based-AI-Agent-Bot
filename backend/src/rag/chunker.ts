/**
 * rag/chunker.ts
 *
 * Splits a knowledge entry's text into overlapping chunks suitable
 * for embedding. Uses a sliding-window character approach with
 * sentence-boundary awareness.
 *
 * Chunk strategy:
 *   1. Split text into sentences (via ". ", "! ", "? " boundaries).
 *   2. Accumulate sentences into a chunk until CHUNK_SIZE is reached.
 *   3. Slide forward, keeping CHUNK_OVERLAP characters in next chunk.
 *   4. Always prepend the entry title to every chunk for context.
 */

export interface TextChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;   // approximate (chars / 4)
}

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '800');
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || '150');

/**
 * Rough token count estimate (1 token ≈ 4 chars for English text).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text into sentences using common punctuation boundaries.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Main chunking function.
 * @param title  - The knowledge entry title (prepended to every chunk)
 * @param body   - The full answer/content text to chunk
 */
export function chunkText(title: string, body: string): TextChunk[] {
  const sentences = splitSentences(body);

  // If entire content fits in one chunk, return as-is
  const fullText = `[${title}]\n${body}`;
  if (fullText.length <= CHUNK_SIZE) {
    return [{
      content: fullText,
      chunkIndex: 0,
      tokenCount: estimateTokens(fullText),
    }];
  }

  const chunks: TextChunk[] = [];
  let current = `[${title}]\n`;
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const candidate = current + sentence + ' ';

    if (candidate.length > CHUNK_SIZE && current.length > `[${title}]\n`.length) {
      // Save current chunk
      const trimmed = current.trimEnd();
      chunks.push({
        content: trimmed,
        chunkIndex,
        tokenCount: estimateTokens(trimmed),
      });
      chunkIndex++;

      // Overlap: keep last CHUNK_OVERLAP chars of current chunk
      const overlap = current.slice(-CHUNK_OVERLAP);
      current = `[${title}]\n${overlap}${sentence} `;
    } else {
      current = candidate;
    }
  }

  // Flush last chunk
  if (current.trim().length > `[${title}]`.length + 2) {
    const trimmed = current.trimEnd();
    chunks.push({
      content: trimmed,
      chunkIndex,
      tokenCount: estimateTokens(trimmed),
    });
  }

  return chunks;
}

/**
 * Chunk a knowledge entry combining its question + answer.
 */
export function chunkEntry(question: string, answer: string): TextChunk[] {
  const body = `Question: ${question}\n\nAnswer: ${answer}`;
  return chunkText(question, body);
}
