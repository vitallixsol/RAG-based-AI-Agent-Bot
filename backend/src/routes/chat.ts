/**
 * routes/chat.ts
 *
 * POST /api/chat — main RAG query endpoint.
 *
 * Flow:
 *   1. Validate request body
 *   2. Call ragQuery() — embed → retrieve → augment → generate
 *   3. Return reply + sources + metadata
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ragQuery } from '../rag/pipeline';
import { asyncHandler } from '../middleware/errorHandler';
import { ChatMessage } from '../types';

const router = Router();

router.post(
  '/',
  [
    body('query').trim().notEmpty().isLength({ max: 2000 }).withMessage('Query required (max 2000 chars)'),
    body('history').optional().isArray(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { query, history = [] } = req.body as { query: string; history: ChatMessage[] };

    const result = await ragQuery(query.trim(), history);

    return res.json({ success: true, data: result });
  })
);

export default router;
