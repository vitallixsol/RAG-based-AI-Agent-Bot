/**
 * db/database.ts
 *
 * High-level database service wrapping all Mongoose operations.
 * All routes import from here — never directly from models.
 *
 * ✅ Pure JavaScript driver (mongoose) — no native compilation
 * ✅ Works on Windows / Mac / Linux without any build tools
 * ✅ Atlas-ready: just swap MONGODB_URI in .env
 */

import mongoose from 'mongoose';
import {
  KnowledgeEntryModel, IKnowledgeEntry,
  ChunkModel, IChunk,
  QueryLogModel,
  AppConfigModel,
} from './models';
import {
  KnowledgeEntry, Chunk, QueryLog, AppConfig, Stats, KnowledgeType, ChatSource,
} from '../types';

// ── Type helpers ───────────────────────────────────────────────────────────
function toEntry(doc: IKnowledgeEntry): KnowledgeEntry {
  return {
    id:          doc._id.toString(),
    type:        doc.type,
    question:    doc.question,
    answer:      doc.answer,
    tags:        doc.tags,
    priority:    doc.priority,
    sourceFile:  doc.sourceFile,
    embedStatus: doc.embedStatus,
    chunkCount:  doc.chunkCount,
    createdAt:   doc.createdAt.toISOString(),
    updatedAt:   doc.updatedAt.toISOString(),
  };
}

// ── Knowledge Entries ──────────────────────────────────────────────────────
export async function insertEntry(e: Omit<KnowledgeEntry, 'id'>): Promise<KnowledgeEntry> {
  const doc = await KnowledgeEntryModel.create(e);
  return toEntry(doc);
}

export async function updateEntry(
  id: string, fields: Partial<KnowledgeEntry>
): Promise<KnowledgeEntry | null> {
  const doc = await KnowledgeEntryModel.findByIdAndUpdate(
    id, { $set: fields }, { new: true }
  );
  return doc ? toEntry(doc) : null;
}

export async function deleteEntry(id: string): Promise<boolean> {
  await ChunkModel.deleteMany({ entryId: new mongoose.Types.ObjectId(id) });
  const res = await KnowledgeEntryModel.findByIdAndDelete(id);
  return !!res;
}

export async function getEntry(id: string): Promise<KnowledgeEntry | null> {
  const doc = await KnowledgeEntryModel.findById(id);
  return doc ? toEntry(doc) : null;
}

export async function getAllEntries(): Promise<KnowledgeEntry[]> {
  const docs = await KnowledgeEntryModel.find().sort({ createdAt: -1 });
  return docs.map(toEntry);
}

// ── Chunks ─────────────────────────────────────────────────────────────────
export async function insertChunksBatch(chunks: Chunk[]): Promise<void> {
  if (chunks.length === 0) return;
  const docs = chunks.map(c => ({
    entryId:    new mongoose.Types.ObjectId(c.entryId),
    chunkIndex: c.chunkIndex,
    content:    c.content,
    embedding:  c.embedding,
    tokenCount: c.tokenCount,
  }));
  await ChunkModel.insertMany(docs, { ordered: false });
}

export async function deleteChunksByEntry(entryId: string): Promise<void> {
  await ChunkModel.deleteMany({ entryId: new mongoose.Types.ObjectId(entryId) });
}

export async function getAllChunksEnriched(): Promise<{
  id: string; entryId: string; chunkIndex: number; content: string;
  embedding: number[]; entryType: KnowledgeType; entryTitle: string;
}[]> {
  // Aggregate to join chunk with its parent entry in one query
  const results = await ChunkModel.aggregate([
    {
      $lookup: {
        from:         'knowledgeentries',
        localField:   'entryId',
        foreignField: '_id',
        as:           'entry',
      },
    },
    { $unwind: '$entry' },
    {
      $project: {
        _id:        1,
        entryId:    1,
        chunkIndex: 1,
        content:    1,
        embedding:  1,
        entryType:  '$entry.type',
        entryTitle: '$entry.question',
      },
    },
  ]);

  return results.map((r: Record<string, unknown>) => ({
    id:         (r['_id'] as mongoose.Types.ObjectId).toString(),
    entryId:    (r['entryId'] as mongoose.Types.ObjectId).toString(),
    chunkIndex: r['chunkIndex'] as number,
    content:    r['content'] as string,
    embedding:  r['embedding'] as number[],
    entryType:  r['entryType'] as KnowledgeType,
    entryTitle: r['entryTitle'] as string,
  }));
}

export async function getTotalChunks(): Promise<number> {
  return ChunkModel.countDocuments();
}

// ── Query Logs ─────────────────────────────────────────────────────────────
export async function insertLog(log: Omit<QueryLog, 'id'>): Promise<void> {
  await QueryLogModel.create({
    query:           log.query,
    response:        log.response,
    sources:         log.sources,
    retrievedChunks: log.retrievedChunks,
    latencyMs:       log.latencyMs,
  });
}

export async function getLogs(limit = 100): Promise<QueryLog[]> {
  const docs = await QueryLogModel.find().sort({ createdAt: -1 }).limit(limit);
  return docs.map(d => ({
    id:              d._id.toString(),
    query:           d.query,
    response:        d.response,
    sources:         d.sources as ChatSource[],
    retrievedChunks: d.retrievedChunks,
    latencyMs:       d.latencyMs,
    timestamp:       d.createdAt.toISOString(),
  }));
}

export async function clearLogs(): Promise<void> {
  await QueryLogModel.deleteMany({});
}

export async function getTodayQueryCount(): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return QueryLogModel.countDocuments({ createdAt: { $gte: start } });
}

// ── App Config ─────────────────────────────────────────────────────────────
async function getConfigDoc(): Promise<IAppConfig> {
  let doc = await AppConfigModel.findOne();
  if (!doc) doc = await AppConfigModel.create({});
  return doc;
}

// Patch IAppConfig type for the return
import { IAppConfig } from './models';

export async function getConfig(): Promise<AppConfig> {
  const doc = await getConfigDoc();
  const totalChunks = await getTotalChunks();
  return {
    companyName:     doc.companyName,
    systemPrompt:    doc.systemPrompt,
    fallbackMsg:     doc.fallbackMsg,
    chatbotTitle:    doc.chatbotTitle,
    welcomeMsg:      doc.welcomeMsg,
    primaryColor:    doc.primaryColor,
    lastTrained:     doc.lastTrained?.toISOString() ?? null,
    totalChunks,
    totalEmbeddings: totalChunks,
  };
}

export async function updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
  const allowed: (keyof AppConfig)[] = [
    'companyName', 'systemPrompt', 'fallbackMsg',
    'chatbotTitle', 'welcomeMsg', 'primaryColor', 'lastTrained',
  ];
  const safeUpdates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      if (key === 'lastTrained') {
        safeUpdates[key] = updates[key] ? new Date(updates[key] as string) : null;
      } else {
        safeUpdates[key] = updates[key];
      }
    }
  }
  await AppConfigModel.findOneAndUpdate({}, { $set: safeUpdates }, { upsert: true });
  return getConfig();
}

export async function setLastTrained(): Promise<void> {
  await AppConfigModel.findOneAndUpdate({}, { $set: { lastTrained: new Date() } }, { upsert: true });
}

// ── Stats ───────────────────────────────────────────────────────────────────
export async function getStats(): Promise<Stats> {
  const [entries, totalChunks, todayQueries, lastTrainedDoc] = await Promise.all([
    KnowledgeEntryModel.find({}, 'type embedStatus'),
    getTotalChunks(),
    getTodayQueryCount(),
    AppConfigModel.findOne({}, 'lastTrained'),
  ]);

  const byType: Record<string, number> = { faq: 0, product: 0, policy: 0, general: 0, document: 0 };
  let embedded = 0, pending = 0, failed = 0;

  for (const e of entries) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    if (e.embedStatus === 'embedded') embedded++;
    else if (e.embedStatus === 'failed') failed++;
    else pending++;
  }

  return {
    total: entries.length,
    embedded, pending, failed,
    categories: Object.values(byType).filter(v => v > 0).length,
    byType: byType as Record<KnowledgeType, number>,
    totalChunks,
    todayQueries,
    lastTrained: lastTrainedDoc?.lastTrained?.toISOString() ?? null,
  };
}

// ── Export ──────────────────────────────────────────────────────────────────
export async function exportAll() {
  const [entries, config] = await Promise.all([getAllEntries(), getConfig()]);
  return { entries, config, exportedAt: new Date().toISOString() };
}

// ── Namespace export (keeps call-site API identical to old db.method()) ─────
export const db = {
  insertEntry,
  updateEntry,
  deleteEntry,
  getEntry,
  getAllEntries,
  insertChunksBatch,
  deleteChunksByEntry,
  getAllChunksEnriched,
  getTotalChunks,
  insertLog,
  getLogs,
  clearLogs,
  getTodayQueryCount,
  getConfig,
  updateConfig,
  setLastTrained,
  getStats,
  exportAll,
};
