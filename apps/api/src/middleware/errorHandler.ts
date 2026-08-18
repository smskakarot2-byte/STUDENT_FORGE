import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export const errorHandler = (
  err: Error & { statusCode?: number; code?: string },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Don't expose internal errors in production
  const safeMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Something went wrong'
    : message;

  res.status(statusCode).json({
    error: safeMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    error: `Route ${req.originalUrl} not found`,
  });
};

export const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
