import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/apiResponse';
import { Logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorCode = err instanceof AppError ? err.errorCode : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected internal server error occurred';

  Logger.error(`[${req.method} ${req.originalUrl}] Error: ${message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  ResponseUtil.error(res, message, statusCode, errorCode, err.stack);
};
