import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { reindexPending, reindexAll, ingestEntry } from '../rag/ingestion';
import { parseDocument } from '../rag/documentParser';
import { db } from '../db/database';
import { asyncHandler } from '../middleware/errorHandler';
import { KnowledgeEntry } from '../types';

const router = Router();

const UPLOAD_DIR = './data/uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.txt','.md','.pdf','.json','.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error(`Unsupported file type: ${ext}`));
  },
});

router.post('/reindex', asyncHandler(async (_req, res) => {
  const result = await reindexPending();
  await db.setLastTrained();
  res.json({ success: true, data: result });
}));

router.post('/reindex-all', asyncHandler(async (_req, res) => {
  const result = await reindexAll();
  res.json({ success: true, data: result });
}));

router.post('/upload', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const { originalname, path: filePath } = req.file;
  const entryType = (req.body.type as string) || 'document';

  try {
    const parsed = await parseDocument(filePath, originalname);
    const created: KnowledgeEntry[] = [];

    if (parsed.entries && parsed.entries.length > 0) {
      for (const pair of parsed.entries) {
        const entry = await db.insertEntry({
          type: entryType as KnowledgeEntry['type'], question: pair.question, answer: pair.answer,
          tags: [], priority: 'normal', sourceFile: originalname,
          embedStatus: 'pending', chunkCount: 0,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
        created.push(entry);
      }
    } else {
      const entry = await db.insertEntry({
        type: entryType as KnowledgeEntry['type'], question: parsed.title, answer: parsed.content,
        tags: [], priority: 'normal', sourceFile: originalname,
        embedStatus: 'pending', chunkCount: 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      created.push(entry);
    }

    let totalChunks = 0;
    for (const entry of created) {
      try { const r = await ingestEntry(entry); totalChunks += r.chunksCreated; } catch { /* logged in ingestEntry */ }
    }
    fs.unlinkSync(filePath);
    return res.json({ success: true, data: { entriesCreated: created.length, totalChunks, fileName: originalname } });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw err;
  }
}));

export default router;
