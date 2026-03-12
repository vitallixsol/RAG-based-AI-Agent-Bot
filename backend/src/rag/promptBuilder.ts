/**
 * rag/promptBuilder.ts
 *
 * Constructs the grounded system prompt that is sent to Claude.
 *
 * The prompt engineering strategy:
 *   1. Role & persona — who the bot is and how it should behave
 *   2. Retrieved context — numbered chunks with source labels
 *   3. Citation instruction — ask the model to reference sources
 *   4. Grounding rules — don't hallucinate, use fallback if unsure
 *   5. Format guide — length, tone, markdown usage
 */

import { RetrievedChunk, AppConfig } from '../types';

export interface BuiltPrompt {
  systemPrompt: string;
  hasContext: boolean;
  contextChunks: number;
}

/**
 * Build the full system prompt injecting retrieved chunks as context.
 */
export function buildSystemPrompt(
  config: AppConfig,
  retrievedChunks: RetrievedChunk[]
): BuiltPrompt {
  const companyName = config.companyName || 'our company';
  const hasContext = retrievedChunks.length > 0;

  // ── Section 1: Role ────────────────────────────────────────────────────
  let prompt = `You are a helpful, knowledgeable AI assistant for ${companyName}.\n`;
  prompt += config.systemPrompt
    ? `${config.systemPrompt}\n`
    : `Your goal is to answer customer questions accurately and concisely based on the company's knowledge base.\n`;

  prompt += `\nBehavior guidelines:\n`;
  prompt += `- Be professional, friendly, and concise.\n`;
  prompt += `- Answer only what is asked; don't add unnecessary caveats.\n`;
  prompt += `- If the answer is a list, format it clearly.\n`;
  prompt += `- Never fabricate information not present in the context below.\n`;

  // ── Section 2: Retrieved Context ──────────────────────────────────────
  if (hasContext) {
    prompt += `\n${'═'.repeat(60)}\n`;
    prompt += `KNOWLEDGE BASE CONTEXT (retrieved via semantic search)\n`;
    prompt += `${'═'.repeat(60)}\n`;
    prompt += `The following ${retrievedChunks.length} passage(s) were retrieved as most relevant to the user's query. `;
    prompt += `Use ONLY this information to answer. Do not use general knowledge that contradicts these passages.\n\n`;

    retrievedChunks.forEach((chunk, i) => {
      const score = (chunk.score * 100).toFixed(1);
      prompt += `[Source ${i + 1}] Type: ${chunk.entryType.toUpperCase()} | Topic: "${chunk.entryTitle}" | Relevance: ${score}%\n`;
      prompt += `${chunk.content}\n\n`;
    });

    prompt += `${'═'.repeat(60)}\n\n`;
    prompt += `Instructions for using context:\n`;
    prompt += `- Ground your answer in the passages above.\n`;
    prompt += `- When referencing information, you may mention "Based on our knowledge base..." or "According to our records...".\n`;
    prompt += `- If multiple sources are relevant, synthesize them into a coherent answer.\n`;
    prompt += `- If the context partially answers the question, answer what you can and note what's unclear.\n`;
  } else {
    // ── Section 3: No context fallback ──────────────────────────────────
    prompt += `\n${'═'.repeat(60)}\n`;
    prompt += `NO RELEVANT CONTEXT FOUND\n`;
    prompt += `${'═'.repeat(60)}\n`;
    prompt += `The semantic search did not find relevant information in the knowledge base for this query.\n\n`;
    prompt += `Fallback response to use:\n"${config.fallbackMsg}"\n\n`;
    prompt += `You may slightly rephrase the fallback to fit naturally, but keep the same meaning. `;
    prompt += `Offer to help with something else.\n`;
  }

  return { systemPrompt: prompt, hasContext, contextChunks: retrievedChunks.length };
}

/**
 * Format retrieved chunks as a readable context string for logging/debugging.
 */
export function formatContextForLog(chunks: RetrievedChunk[]): string {
  return chunks.map((c, i) =>
    `[${i + 1}] ${c.entryTitle} (${(c.score * 100).toFixed(1)}%): ${c.content.slice(0, 100)}…`
  ).join('\n');
}
