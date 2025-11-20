/**
 * 响应辅助函数
 * 将 Either 结果转换为 HTTP 响应
 */

import type { Response } from 'express';
import type { Result } from '../../utils/fp.js';
import type { ApiSuccess, ApiError } from '../../../../shared/types.js';
import { E } from '../../utils/fp.js';

/**
 * 发送成功响应
 */
export const sendSuccess = <T>(res: Response, data: T, status: number = 200): void => {
  const response: ApiSuccess<T> = {
    success: true,
    data,
  };
  res.status(status).json(response);
};

/**
 * 发送错误响应
 */
export const sendError = (
  res: Response,
  error: Error | string,
  status: number = 400
): void => {
  const message = typeof error === 'string' ? error : error.message;
  const response: ApiError = {
    success: false,
    error: {
      code: 'REQUEST_ERROR',
      message,
    },
  };
  res.status(status).json(response);
};

/**
 * 处理 Either 结果并发送响应
 */
export const handleResult = <T>(
  res: Response,
  result: Result<Error, T>,
  successStatus: number = 200
): void => {
  if (E.isLeft(result)) {
    sendError(res, result.left);
  } else {
    sendSuccess(res, result.right, successStatus);
  }
};
