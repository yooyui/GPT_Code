/**
 * 审计日志路由
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { AuditService } from '../../application/audit-service.js';
import { handleResult, sendError } from '../middleware/response-helper.js';

export const createAuditLogRoutes = (auditService: AuditService): Router => {
  const router = Router();

  // GET /api/audit-logs - 获取所有审计日志
  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const result = await auditService.getAllLogs(limit);
      handleResult(res, result);
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // GET /api/audit-logs/user/:userId - 获取用户的审计日志
  router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const result = await auditService.getLogsByUserId(req.params.userId, limit);
      handleResult(res, result);
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  return router;
};
