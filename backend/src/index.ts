import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './db/connection';
import { db } from './db/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { getEmbeddingInfo } from './rag/embedder';

import knowledgeRoutes from './routes/knowledge';
import chatRoutes from './routes/chat';
import ingestRoutes from './routes/ingest';
import configRoutes from './routes/config';
import logsRoutes from './routes/logs';

async function bootstrap() {
  // ── Connect to MongoDB first ─────────────────────────────────────────
  await connectDB();

  const app = express();
  const PORT = process.env.PORT || 3001;

  app.use(helmet());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/api/', rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    standardHeaders: true, legacyHeaders: false,
  }));

  app.get('/api/health', async (_req, res) => {
    const stats = await db.getStats();
    const embInfo = getEmbeddingInfo();
    res.json({
      status: 'ok', timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      api: { anthropic: !!process.env.ANTHROPIC_API_KEY, openai: !!process.env.OPENAI_API_KEY },
      database: 'MongoDB (mongoose)',
      rag: {
        embeddingModel:      embInfo.model,
        embeddingDimensions: embInfo.dimensions,
        totalEntries:        stats.total,
        embeddedEntries:     stats.embedded,
        pendingEntries:      stats.pending,
        failedEntries:       stats.failed,
        totalChunks:         stats.totalChunks,
      },
    });
  });

  app.use('/api/knowledge', knowledgeRoutes);
  app.use('/api/chat',      chatRoutes);
  app.use('/api/ingest',    ingestRoutes);
  app.use('/api/config',    configRoutes);
  app.use('/api/logs',      logsRoutes);
  app.use(notFound);
  app.use(errorHandler);

  app.listen(PORT, async () => {
    const stats = await db.getStats();
    console.log(`\n${'═'.repeat(55)}`);
    console.log(`  🧠  NeuralBase RAG API`);
    console.log(`${'═'.repeat(55)}`);
    console.log(`  URL:      http://localhost:${PORT}`);
    console.log(`  Health:   http://localhost:${PORT}/api/health`);
    console.log(`${'─'.repeat(55)}`);
    console.log(`  Anthropic: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  OpenAI:    ${process.env.OPENAI_API_KEY   ? '✅ Set' : '❌ Missing'}`);
    console.log(`  MongoDB:   ${process.env.MONGODB_URI || 'mongodb://localhost:27017/neuralbase'}`);
    console.log(`${'─'.repeat(55)}`);
    console.log(`  Entries:   ${stats.total} (${stats.embedded} embedded)`);
    console.log(`  Chunks:    ${stats.totalChunks}`);
    console.log(`${'═'.repeat(55)}\n`);
  });
}

bootstrap().catch(err => { console.error('Fatal startup error:', err); process.exit(1); });
