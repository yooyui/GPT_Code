/**
 * 仪表板路由
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { DashboardService } from '../../application/dashboard-service.js';
import { handleResult, sendError } from '../middleware/response-helper.js';

export const createDashboardRoutes = (dashboardService: DashboardService): Router => {
  const router = Router();

  // GET /api/dashboard/stats - 获取统计数据
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const result = await dashboardService.getStats();
      handleResult(res, result);
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  return router;
};
