/**
 * 订阅路由
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { SubscriptionService } from '../../application/subscription-service.js';
import type { AuditService } from '../../application/audit-service.js';
import { handleResult, sendError } from '../middleware/response-helper.js';
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from '../../../../shared/types.js';

export const createSubscriptionRoutes = (
  subscriptionService: SubscriptionService,
  auditService: AuditService
): Router => {
  const router = Router();

  // GET /api/subscriptions - 获取所有订阅
  router.get('/', async (req: Request, res: Response) => {
    try {
      const result = await subscriptionService.getAllSubscriptions();
      handleResult(res, result);
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // GET /api/subscriptions/:id - 根据ID获取订阅
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const result = await subscriptionService.getSubscriptionById(req.params.id);
      handleResult(res, result);
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // POST /api/subscriptions - 创建订阅
  router.post('/', async (req: Request<{}, {}, CreateSubscriptionInput>, res: Response) => {
    try {
      const result = await subscriptionService.createSubscription(req.body);
      handleResult(res, result, 201);

      if (result._tag === 'Right') {
        await auditService.createLog({
          userId: 'system',
          action: 'CREATE_SUBSCRIPTION',
          targetType: 'subscription',
          targetId: result.right.id,
          details: { name: result.right.name },
        });
      }
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // PATCH /api/subscriptions/:id - 更新订阅
  router.patch('/:id', async (req: Request<{ id: string }, {}, UpdateSubscriptionInput>, res: Response) => {
    try {
      const result = await subscriptionService.updateSubscription(req.params.id, req.body);
      handleResult(res, result);

      if (result._tag === 'Right') {
        await auditService.createLog({
          userId: 'system',
          action: 'UPDATE_SUBSCRIPTION',
          targetType: 'subscription',
          targetId: req.params.id,
          details: req.body,
        });
      }
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  return router;
};
