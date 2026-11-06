import type { Request, Response, NextFunction } from 'express'
import { HttpError } from '../lib/store.js'

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'API route not found' })
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) { res.status(error.status).json({ success: false, message: error.message }); return }
  if ('status' in error && error.status === 413) { res.status(413).json({ success: false, message: 'This upload or article is too large. Images must be under 5 MB.' }); return }
  if (error instanceof SyntaxError && 'body' in error) { res.status(400).json({ success: false, message: 'The request body must be valid JSON.' }); return }
  console.error('API request failed:', error.name)
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
  })
}
