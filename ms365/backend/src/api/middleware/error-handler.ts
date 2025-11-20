/**
 * 错误处理中间件
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../infrastructure/logger/index.js';
import type { ApiError } from '../../../../shared/types.js';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response<ApiError>,
  next: NextFunction
): void => {
  logger.error('API Error', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    },
  });
};
