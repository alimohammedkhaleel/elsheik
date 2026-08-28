import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/apiResponse';

export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtil.error(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'RESOURCE_NOT_FOUND'
  );
};
