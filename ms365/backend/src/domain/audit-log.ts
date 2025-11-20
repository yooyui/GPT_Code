/**
 * 审计日志领域模型
 * 遵循函数式编程：纯函数、不可变性、类型安全
 */

import { v4 as uuidv4 } from 'uuid';
import type { AuditLog, AuditAction, CreateAuditLogInput } from '../../../shared/types.js';
import { success, failure } from '../utils/fp.js';
import type { Result } from '../utils/fp.js';

// ============= 常量定义 =============

export const VALID_ACTIONS: readonly AuditAction[] = [
  'CREATE_USER',
  'UPDATE_USER',
  'DELETE_USER',
  'ASSIGN_LICENSE',
  'REVOKE_LICENSE',
  'CREATE_SUBSCRIPTION',
  'UPDATE_SUBSCRIPTION',
  'DELETE_SUBSCRIPTION',
  'IMPORT_DATA',
  'EXPORT_DATA',
] as const;

export const VALID_TARGET_TYPES = [
  'user',
  'subscription',
  'license',
  'system',
] as const;

// ============= 类型守卫 =============

/**
 * 检查是否为有效的审计动作
 */
export const isValidAction = (action: string): action is AuditAction =>
  VALID_ACTIONS.includes(action as AuditAction);

/**
 * 检查是否为有效的目标类型
 */
export const isValidTargetType = (type: string): boolean =>
  VALID_TARGET_TYPES.includes(type as typeof VALID_TARGET_TYPES[number]);

// ============= 验证函数 =============

/**
 * 验证审计日志输入
 */
export const validateCreateAuditLogInput = (
  input: CreateAuditLogInput
): Result<Error, CreateAuditLogInput> => {
  // 验证动作
  if (!isValidAction(input.action)) {
    return failure('Invalid audit action');
  }

  // 验证目标类型
  if (!isValidTargetType(input.targetType)) {
    return failure('Invalid target type');
  }

  // 验证用户ID
  if (!input.userId || input.userId.trim() === '') {
    return failure('User ID is required');
  }

  // 验证目标ID
  if (!input.targetId || input.targetId.trim() === '') {
    return failure('Target ID is required');
  }

  return success(input);
};

// ============= 创建函数 =============

/**
 * 创建审计日志（纯函数）
 */
export const createAuditLog = (input: CreateAuditLogInput): AuditLog => ({
  id: uuidv4(),
  userId: input.userId,
  action: input.action,
  targetType: input.targetType,
  targetId: input.targetId,
  details: JSON.stringify(input.details),
  timestamp: new Date().toISOString(),
});

// ============= 辅助函数 =============

/**
 * 格式化审计日志详情（纯函数）
 */
export const formatAuditDetails = (log: AuditLog): Record<string, unknown> => {
  try {
    return JSON.parse(log.details);
  } catch {
    return { raw: log.details };
  }
};

/**
 * 创建用户相关的审计日志详情
 */
export const createUserAuditDetails = (
  action: 'create' | 'update' | 'delete',
  userId: string,
  changes?: Record<string, unknown>
): Record<string, unknown> => ({
  action,
  userId,
  changes: changes ?? {},
  timestamp: new Date().toISOString(),
});

/**
 * 创建订阅相关的审计日志详情
 */
export const createSubscriptionAuditDetails = (
  action: 'create' | 'update' | 'delete' | 'assign' | 'revoke',
  subscriptionId: string,
  userId?: string,
  changes?: Record<string, unknown>
): Record<string, unknown> => ({
  action,
  subscriptionId,
  userId,
  changes: changes ?? {},
  timestamp: new Date().toISOString(),
});

// ============= 查询辅助函数 =============

/**
 * 按用户ID过滤日志（纯函数）
 */
export const filterByUserId = (userId: string) => (logs: readonly AuditLog[]): readonly AuditLog[] =>
  logs.filter(log => log.userId === userId);

/**
 * 按动作过滤日志（纯函数）
 */
export const filterByAction = (action: AuditAction) => (logs: readonly AuditLog[]): readonly AuditLog[] =>
  logs.filter(log => log.action === action);

/**
 * 按目标类型过滤日志（纯函数）
 */
export const filterByTargetType = (targetType: string) => (logs: readonly AuditLog[]): readonly AuditLog[] =>
  logs.filter(log => log.targetType === targetType);

/**
 * 按时间范围过滤日志（纯函数）
 */
export const filterByTimeRange = (startDate: Date, endDate: Date) => (
  logs: readonly AuditLog[]
): readonly AuditLog[] =>
  logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });

/**
 * 按日期排序（降序）
 */
export const sortByDateDesc = (logs: readonly AuditLog[]): readonly AuditLog[] =>
  [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

/**
 * 按日期排序（升序）
 */
export const sortByDateAsc = (logs: readonly AuditLog[]): readonly AuditLog[] =>
  [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
