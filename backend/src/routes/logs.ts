import { Router, Request } from 'express';
import { db } from '../db/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res) => {
  const limit = Math.min(parseInt(req.query.limit as string || '100'), 500);
  res.json({ success: true, data: await db.getLogs(limit) });
}));

router.delete('/', asyncHandler(async (_req, res) => {
  await db.clearLogs();
  res.json({ success: true, message: 'Logs cleared' });
}));

export default router;
