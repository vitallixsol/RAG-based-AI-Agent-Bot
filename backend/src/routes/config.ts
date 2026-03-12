import { Router } from 'express';
import { db } from '../db/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await db.getConfig() });
}));

router.put('/', asyncHandler(async (req, res) => {
  res.json({ success: true, data: await db.updateConfig(req.body) });
}));

router.post('/train', asyncHandler(async (_req, res) => {
  await db.setLastTrained();
  res.json({ success: true, data: await db.getConfig(), message: 'Training timestamp updated' });
}));

export default router;
