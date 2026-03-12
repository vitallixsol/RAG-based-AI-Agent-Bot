/**
 * rag/documentParser.ts
 *
 * Extracts plain text from uploaded files for ingestion.
 * Supported formats:
 *   - .txt  — raw text
 *   - .md   — markdown (strip markers, keep content)
 *   - .pdf  — extract text via pdf-parse
 *   - .json — extract question/answer pairs (bulk import format)
 *   - .csv  — extract Q&A pairs (question,answer columns)
 */

import fs from 'fs';
import path from 'path';
// @ts-ignore — pdf-parse types are incomplete
import pdfParse from 'pdf-parse';

export interface ParsedDocument {
  title: string;
  content: string;
  mimeType: string;
  entries?: { question: string; answer: string }[];  // for structured formats
}

/**
 * Parse an uploaded file into text content.
 */
export async function parseDocument(
  filePath: string,
  originalName: string
): Promise<ParsedDocument> {
  const ext = path.extname(originalName).toLowerCase();
  const title = path.basename(originalName, ext);

  switch (ext) {
    case '.txt':
      return parseTxt(filePath, title);
    case '.md':
      return parseMarkdown(filePath, title);
    case '.pdf':
      return parsePdf(filePath, title);
    case '.json':
      return parseJson(filePath, title);
    case '.csv':
      return parseCsv(filePath, title);
    default:
      throw new Error(`Unsupported file type: ${ext}. Supported: .txt, .md, .pdf, .json, .csv`);
  }
}

async function parseTxt(filePath: string, title: string): Promise<ParsedDocument> {
  const content = fs.readFileSync(filePath, 'utf-8').trim();
  return { title, content, mimeType: 'text/plain' };
}

async function parseMarkdown(filePath: string, title: string): Promise<ParsedDocument> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  // Strip markdown formatting for cleaner embedding
  const content = raw
    .replace(/^#{1,6}\s+/gm, '')         // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')     // bold
    .replace(/\*(.+?)\*/g, '$1')         // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links → text
    .replace(/^\s*[-*+]\s+/gm, '• ')    // bullet lists
    .trim();
  return { title, content, mimeType: 'text/markdown' };
}

async function parsePdf(filePath: string, title: string): Promise<ParsedDocument> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const content = data.text.replace(/\s{3,}/g, '\n').trim();
  if (!content) throw new Error('PDF appears to be scanned (no extractable text)');
  return { title, content, mimeType: 'application/pdf' };
}

async function parseJson(filePath: string, title: string): Promise<ParsedDocument> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // Support array of {question, answer} objects (bulk import)
  if (Array.isArray(data)) {
    const entries = data
      .filter(item => item.question && item.answer)
      .map(item => ({ question: String(item.question), answer: String(item.answer) }));

    if (entries.length > 0) {
      return {
        title,
        content: entries.map(e => `Q: ${e.question}\nA: ${e.answer}`).join('\n\n'),
        mimeType: 'application/json',
        entries,
      };
    }
  }

  // Fallback: stringify the whole thing
  return { title, content: JSON.stringify(data, null, 2), mimeType: 'application/json' };
}

async function parseCsv(filePath: string, title: string): Promise<ParsedDocument> {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());

  if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const qIdx = headers.findIndex(h => h.includes('question') || h.includes('q'));
  const aIdx = headers.findIndex(h => h.includes('answer') || h.includes('a') || h.includes('content'));

  if (qIdx === -1 || aIdx === -1) {
    throw new Error('CSV must have "question" and "answer" columns');
  }

  const entries: { question: string; answer: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse (handles basic quoted fields)
    const cols = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g);
    if (!cols || cols.length <= Math.max(qIdx, aIdx)) continue;
    const q = cols[qIdx]?.replace(/^"|"$/g, '').trim();
    const a = cols[aIdx]?.replace(/^"|"$/g, '').trim();
    if (q && a) entries.push({ question: q, answer: a });
  }

  return {
    title,
    content: entries.map(e => `Q: ${e.question}\nA: ${e.answer}`).join('\n\n'),
    mimeType: 'text/csv',
    entries,
  };
}
