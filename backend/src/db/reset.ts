/**
 * db/reset.ts  — npm run db:reset
 * Drops all NeuralBase collections (knowledge, chunks, logs, config).
 */
import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from './connection';
import { KnowledgeEntryModel, ChunkModel, QueryLogModel, AppConfigModel } from './models';

async function reset() {
  await connectDB();
  await Promise.all([
    KnowledgeEntryModel.deleteMany({}),
    ChunkModel.deleteMany({}),
    QueryLogModel.deleteMany({}),
    AppConfigModel.deleteMany({}),
  ]);
  console.log('✅ All collections cleared');
  await disconnectDB();
}

reset().catch(err => { console.error(err); process.exit(1); });
