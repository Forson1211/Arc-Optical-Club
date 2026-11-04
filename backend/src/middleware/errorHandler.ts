import type { Request, Response, NextFunction } from 'express'

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'API route not found' })
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(error)
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
  })
}
