/**
 * 审计服务层
 * 记录和查询系统操作日志
 */

import { pipe, E } from '../utils/fp.js';
import type { Result } from '../utils/fp.js';
import type { AuditLogRepository } from '../infrastructure/database/sqlite.js';
import type { AuditLog, CreateAuditLogInput } from '../../../shared/types.js';
import * as AuditDomain from '../domain/audit-log.js';

// ============= 服务接口 =============

export interface AuditService {
  readonly getAllLogs: (limit?: number) => Promise<Result<Error, readonly AuditLog[]>>;
  readonly getLogById: (id: string) => Promise<Result<Error, AuditLog>>;
  readonly getLogsByUserId: (userId: string, limit?: number) => Promise<Result<Error, readonly AuditLog[]>>;
  readonly createLog: (input: CreateAuditLogInput) => Promise<Result<Error, AuditLog>>;
}

// ============= 服务实现 =============

export const createAuditService = (auditRepo: AuditLogRepository): AuditService => ({
  /**
   * 获取所有审计日志
   */
  getAllLogs: async (limit = 100) => {
    return auditRepo.findAll(limit);
  },

  /**
   * 根据ID获取日志
   */
  getLogById: async (id: string) => {
    return pipe(
      auditRepo.findById(id),
      E.chain((log) =>
        log === null ? E.left(new Error('Audit log not found')) : E.right(log)
      )
    );
  },

  /**
   * 根据用户ID获取日志
   */
  getLogsByUserId: async (userId: string, limit = 100) => {
    return auditRepo.findByUserId(userId, limit);
  },

  /**
   * 创建审计日志
   * 函数式管道：验证输入 -> 创建日志 -> 保存
   */
  createLog: async (input: CreateAuditLogInput) => {
    return pipe(
      // 1. 验证输入
      AuditDomain.validateCreateAuditLogInput(input),
      E.chain(() => {
        // 2. 创建日志
        const log = AuditDomain.createAuditLog(input);
        // 3. 保存
        return auditRepo.create(log);
      })
    );
  },
});
