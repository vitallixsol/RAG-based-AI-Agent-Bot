import { Request, Response, NextFunction } from 'express';

// ── Global Error Handler ───────────────────────────────────────────────────
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err.message);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  // OpenAI / Anthropic API errors
  if (err.message.includes('API key') || err.message.includes('401')) {
    return res.status(401).json({ success: false, message: 'Invalid API key. Check your .env configuration.' });
  }
  if (err.message.includes('429') || err.message.includes('rate limit')) {
    return res.status(429).json({ success: false, message: 'API rate limit exceeded. Please wait and retry.' });
  }
  if (err.message.includes('Embedding failed')) {
    return res.status(503).json({ success: false, message: err.message });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
}

// ── 404 Handler ────────────────────────────────────────────────────────────
export function notFound(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
}

// ── Async wrapper ──────────────────────────────────────────────────────────
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
