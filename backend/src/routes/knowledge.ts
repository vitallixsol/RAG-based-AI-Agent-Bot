import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db/database';
import { ingestEntry } from '../rag/ingestion';
import { asyncHandler } from '../middleware/errorHandler';
import { KnowledgeEntry, KnowledgeType, Priority } from '../types';

const router = Router();

const entryValidation = [
  body('type').isIn(['faq','product','policy','general','document']),
  body('question').trim().notEmpty().isLength({ max: 500 }),
  body('answer').trim().notEmpty().isLength({ max: 10000 }),
  body('tags').optional().isArray(),
  body('priority').optional().isIn(['high','normal','low']),
];
function validate(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ success: false, errors: errors.array() }); return false; }
  return true;
}

router.get('/', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await db.getAllEntries() });
}));

router.get('/stats', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await db.getStats() });
}));

router.get('/export', asyncHandler(async (_req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="neuralbase-export.json"');
  res.json(await db.exportAll());
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const entry = await db.getEntry(req.params.id);
  if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
  return res.json({ success: true, data: entry });
}));

router.post('/', entryValidation, asyncHandler(async (req: Request, res: Response) => {
  if (!validate(req, res)) return;
  const entry = await db.insertEntry({
    type:        req.body.type as KnowledgeType,
    question:    req.body.question.trim(),
    answer:      req.body.answer.trim(),
    tags:        req.body.tags ?? [],
    priority:    (req.body.priority ?? 'normal') as Priority,
    sourceFile:  req.body.sourceFile,
    embedStatus: 'pending',
    chunkCount:  0,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  });
  ingestEntry(entry).catch(err => console.error('[Ingest] Background failed:', err));
  res.status(201).json({ success: true, data: entry, message: 'Entry created. Embedding in progress…' });
}));

router.put('/:id', entryValidation, asyncHandler(async (req: Request, res: Response) => {
  if (!validate(req, res)) return;
  const updated = await db.updateEntry(req.params.id, {
    type:        req.body.type,
    question:    req.body.question?.trim(),
    answer:      req.body.answer?.trim(),
    tags:        req.body.tags,
    priority:    req.body.priority,
    embedStatus: 'pending',
  });
  if (!updated) return res.status(404).json({ success: false, message: 'Entry not found' });
  ingestEntry(updated).catch(err => console.error('[Ingest] Re-ingest failed:', err));
  return res.json({ success: true, data: updated, message: 'Entry updated. Re-embedding in progress…' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await db.deleteEntry(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Entry not found' });
  return res.json({ success: true, message: 'Entry and chunks deleted' });
}));

router.post('/import', asyncHandler(async (req: Request, res: Response) => {
  const { entries } = req.body as { entries: KnowledgeEntry[] };
  if (!Array.isArray(entries)) return res.status(400).json({ success: false, message: 'Body must have "entries" array' });
  const imported: KnowledgeEntry[] = [];
  for (const e of entries) {
    if (!e.question || !e.answer) continue;
    const entry = await db.insertEntry({
      type:        e.type || 'general',
      question:    String(e.question).trim(),
      answer:      String(e.answer).trim(),
      tags:        Array.isArray(e.tags) ? e.tags : [],
      priority:    e.priority || 'normal',
      embedStatus: 'pending',
      chunkCount:  0,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    });
    imported.push(entry);
  }
  imported.forEach(e => ingestEntry(e).catch(console.error));
  return res.json({ success: true, message: `Imported ${imported.length} entries. Embedding in background…`, data: { count: imported.length } });
}));

export default router;
