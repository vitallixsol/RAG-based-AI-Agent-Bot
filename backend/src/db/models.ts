/**
 * db/models.ts
 *
 * All Mongoose schemas and models.
 *
 * Collections:
 *   knowledgeentries  — source documents / FAQs / policies
 *   chunks            — text chunks with float[] embeddings
 *   querylogs         — full audit trail of every chat query
 *   appconfigs        — key-value settings (single document)
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { KnowledgeType, Priority, EmbedStatus } from '../types';

// ── KnowledgeEntry ─────────────────────────────────────────────────────────
export interface IKnowledgeEntry extends Document {
  type:        KnowledgeType;
  question:    string;
  answer:      string;
  tags:        string[];
  priority:    Priority;
  sourceFile?: string;
  embedStatus: EmbedStatus;
  chunkCount:  number;
  createdAt:   Date;
  updatedAt:   Date;
}

const KnowledgeEntrySchema = new Schema<IKnowledgeEntry>(
  {
    type:        { type: String, enum: ['faq','product','policy','general','document'], default: 'general' },
    question:    { type: String, required: true, trim: true, maxlength: 500 },
    answer:      { type: String, required: true, trim: true, maxlength: 10000 },
    tags:        { type: [String], default: [] },
    priority:    { type: String, enum: ['high','normal','low'], default: 'normal' },
    sourceFile:  { type: String },
    embedStatus: { type: String, enum: ['pending','embedded','failed'], default: 'pending' },
    chunkCount:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

KnowledgeEntrySchema.index({ type: 1 });
KnowledgeEntrySchema.index({ embedStatus: 1 });
KnowledgeEntrySchema.index({ tags: 1 });
KnowledgeEntrySchema.index({ createdAt: -1 });

export const KnowledgeEntryModel: Model<IKnowledgeEntry> =
  mongoose.models.KnowledgeEntry ||
  mongoose.model<IKnowledgeEntry>('KnowledgeEntry', KnowledgeEntrySchema);

// ── Chunk ──────────────────────────────────────────────────────────────────
export interface IChunk extends Document {
  entryId:    mongoose.Types.ObjectId;
  chunkIndex: number;
  content:    string;
  embedding:  number[];   // 1536-dim float array
  tokenCount: number;
  createdAt:  Date;
}

const ChunkSchema = new Schema<IChunk>(
  {
    entryId:    { type: Schema.Types.ObjectId, ref: 'KnowledgeEntry', required: true, index: true },
    chunkIndex: { type: Number, required: true },
    content:    { type: String, required: true },
    embedding:  { type: [Number], required: true },
    tokenCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ChunkSchema.index({ entryId: 1, chunkIndex: 1 }, { unique: true });

export const ChunkModel: Model<IChunk> =
  mongoose.models.Chunk ||
  mongoose.model<IChunk>('Chunk', ChunkSchema);

// ── QueryLog ───────────────────────────────────────────────────────────────
export interface IQueryLog extends Document {
  query:           string;
  response:        string;
  sources:         {
    entryId:    string;
    entryType:  KnowledgeType;
    entryTitle: string;
    score:      number;
    chunkIndex: number;
  }[];
  retrievedChunks: number;
  latencyMs:       number;
  createdAt:       Date;
}

const QueryLogSchema = new Schema<IQueryLog>(
  {
    query:           { type: String, required: true },
    response:        { type: String, required: true },
    sources:         [{
      entryId:    String,
      entryType:  String,
      entryTitle: String,
      score:      Number,
      chunkIndex: Number,
    }],
    retrievedChunks: { type: Number, default: 0 },
    latencyMs:       { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

QueryLogSchema.index({ createdAt: -1 });

export const QueryLogModel: Model<IQueryLog> =
  mongoose.models.QueryLog ||
  mongoose.model<IQueryLog>('QueryLog', QueryLogSchema);

// ── AppConfig ──────────────────────────────────────────────────────────────
// Single document — we use findOneAndUpdate with upsert
export interface IAppConfig extends Document {
  companyName:  string;
  systemPrompt: string;
  fallbackMsg:  string;
  chatbotTitle: string;
  welcomeMsg:   string;
  primaryColor: string;
  lastTrained:  Date | null;
  updatedAt:    Date;
}

const AppConfigSchema = new Schema<IAppConfig>(
  {
    companyName:  { type: String, default: 'My Company' },
    systemPrompt: { type: String, default: 'You are a knowledgeable and friendly AI assistant. Help customers with accurate, concise answers based on the provided company knowledge.' },
    fallbackMsg:  { type: String, default: "I'm sorry, I don't have specific information about that. Please contact our support team for assistance." },
    chatbotTitle: { type: String, default: 'Company Assistant' },
    welcomeMsg:   { type: String, default: 'Hello! How can I help you today?' },
    primaryColor: { type: String, default: '#5b8cff' },
    lastTrained:  { type: Date, default: null },
  },
  { timestamps: true }
);

export const AppConfigModel: Model<IAppConfig> =
  mongoose.models.AppConfig ||
  mongoose.model<IAppConfig>('AppConfig', AppConfigSchema);
