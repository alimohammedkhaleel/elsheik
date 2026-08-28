import { Response } from 'express';
import { ApiResponse } from '../types/api.types';

export class ResponseUtil {
  /**
   * Send a successful JSON response
   */
  static success<T>(
    res: Response,
    message: string = 'Operation successful',
    data?: T,
    statusCode: number = 200
  ): Response {
    const responseBody: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }

  /**
   * Send an error JSON response
   */
  static error(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = 500,
    errorCode?: string,
    details?: unknown
  ): Response {
    const responseBody: ApiResponse = {
      success: false,
      message,
      error: {
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? details : undefined,
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }
}
