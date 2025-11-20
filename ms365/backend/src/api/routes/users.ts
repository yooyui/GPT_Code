/**
 * 用户路由
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { UserService } from '../../application/user-service.js';
import type { AuditService } from '../../application/audit-service.js';
import { handleResult, sendError } from '../middleware/response-helper.js';
import type { CreateUserInput, UpdateUserInput } from '../../../../shared/types.js';

export const createUserRoutes = (
  userService: UserService,
  auditService: AuditService
): Router => {
  const router = Router();

  // GET /api/users - 获取所有用户
  router.get('/', async (req: Request, res: Response) => {
    try {
      const result = await userService.getAllUsers();
      handleResult(res, result);
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // GET /api/users/domains/verified - 获取已验证的域名（必须在 /:id 之前）
  router.get('/domains/verified', async (req: Request, res: Response) => {
    try {
      const result = await userService.getVerifiedDomains();
      handleResult(res, result);
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // GET /api/users/roles - 获取可用角色（必须在 /:id 之前）
  router.get('/roles', async (req: Request, res: Response) => {
    try {
      const result = await userService.getAvailableRoles();
      handleResult(res, result);
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // GET /api/users/:id - 根据ID获取用户
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const result = await userService.getUserById(req.params.id);
      handleResult(res, result);
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // POST /api/users - 创建用户
  router.post('/', async (req: Request<{}, {}, CreateUserInput>, res: Response) => {
    try {
      const result = await userService.createUser(req.body);
      handleResult(res, result, 201);

      // 记录审计日志
      if (result._tag === 'Right') {
        await auditService.createLog({
          userId: 'system', // TODO: 从认证上下文获取
          action: 'CREATE_USER',
          targetType: 'user',
          targetId: result.right.id,
          details: { email: result.right.email, name: result.right.name },
        });
      }
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // PATCH /api/users/:id - 更新用户
  router.patch('/:id', async (req: Request<{ id: string }, {}, UpdateUserInput>, res: Response) => {
    try {
      const result = await userService.updateUser(req.params.id, req.body);
      handleResult(res, result);

      // 记录审计日志
      if (result._tag === 'Right') {
        await auditService.createLog({
          userId: 'system',
          action: 'UPDATE_USER',
          targetType: 'user',
          targetId: req.params.id,
          details: req.body,
        });
      }
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // POST /api/users/:id/assign-subscription - 分配订阅
  router.post('/:id/assign-subscription', async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.body;
      if (!subscriptionId) {
        sendError(res, 'Subscription ID is required');
        return;
      }

      const result = await userService.assignSubscription(req.params.id, subscriptionId);
      handleResult(res, result);

      // 记录审计日志
      if (result._tag === 'Right') {
        await auditService.createLog({
          userId: 'system',
          action: 'ASSIGN_LICENSE',
          targetType: 'user',
          targetId: req.params.id,
          details: { subscriptionId },
        });
      }
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  // POST /api/users/:id/revoke-subscription - 回收订阅
  router.post('/:id/revoke-subscription', async (req: Request, res: Response) => {
    try {
      const result = await userService.revokeSubscription(req.params.id);
      handleResult(res, result);

      // 记录审计日志
      if (result._tag === 'Right') {
        await auditService.createLog({
          userId: 'system',
          action: 'REVOKE_LICENSE',
          targetType: 'user',
          targetId: req.params.id,
          details: {},
        });
      }
    } catch (error) {
      sendError(res, error as Error, 500);
    }
  });

  return router;
};
