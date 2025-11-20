/**
 * 订阅领域模型
 * 遵循函数式编程：纯函数、不可变性、类型安全
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Subscription,
  SubscriptionStatus,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../../../shared/types.js';
import {
  pipe,
  E,
  validateNonEmpty,
  validatePositive,
  validateFutureDate,
  success,
  failure,
} from '../utils/fp.js';
import type { Result } from '../utils/fp.js';

// ============= 类型守卫 =============

/**
 * 检查是否为有效的订阅状态
 */
export const isValidStatus = (status: string): status is SubscriptionStatus =>
  ['active', 'expired'].includes(status);

/**
 * 检查订阅是否活跃
 */
export const isActive = (subscription: Subscription): boolean =>
  subscription.status === 'active' && new Date(subscription.expiryDate) > new Date();

/**
 * 检查订阅是否有可用许可
 */
export const hasAvailableLicenses = (subscription: Subscription): boolean =>
  subscription.usedLicenses < subscription.totalLicenses;

// ============= 计算函数 =============

/**
 * 计算可用许可数量（纯函数）
 */
export const calculateAvailableLicenses = (subscription: Subscription): number =>
  Math.max(0, subscription.totalLicenses - subscription.usedLicenses);

/**
 * 计算许可使用率（纯函数）
 */
export const calculateLicenseUtilization = (subscription: Subscription): number =>
  subscription.totalLicenses === 0
    ? 0
    : (subscription.usedLicenses / subscription.totalLicenses) * 100;

// ============= 验证函数 =============

/**
 * 验证订阅名称
 */
const validateSubscriptionName = (name: string): Result<Error, string> =>
  pipe(
    validateNonEmpty(name, 'Subscription name'),
    E.chain((n) =>
      n.length >= 3 && n.length <= 100
        ? success(n)
        : failure('Subscription name must be between 3 and 100 characters')
    )
  );

/**
 * 验证许可证总数
 */
const validateTotalLicenses = (total: number): Result<Error, number> =>
  pipe(
    validatePositive(total, 'Total licenses'),
    E.chain((t) =>
      Number.isInteger(t)
        ? success(t)
        : failure('Total licenses must be an integer')
    )
  );

/**
 * 验证创建订阅输入
 */
export const validateCreateSubscriptionInput = (
  input: CreateSubscriptionInput
): Result<Error, CreateSubscriptionInput> => {
  // 验证名称
  const nameResult = validateSubscriptionName(input.name);
  if (E.isLeft(nameResult)) return nameResult;

  // 验证许可证总数
  const licensesResult = validateTotalLicenses(input.totalLicenses);
  if (E.isLeft(licensesResult)) return licensesResult;

  // 验证过期日期
  const dateResult = validateFutureDate(input.expiryDate);
  if (E.isLeft(dateResult)) return dateResult;

  return success(input);
};

/**
 * 验证更新订阅输入
 */
export const validateUpdateSubscriptionInput = (
  input: UpdateSubscriptionInput
): Result<Error, UpdateSubscriptionInput> => {
  // 如果有名称，验证名称
  if (input.name !== undefined) {
    const nameResult = validateSubscriptionName(input.name);
    if (E.isLeft(nameResult)) return nameResult;
  }

  // 如果有许可证总数，验证
  if (input.totalLicenses !== undefined) {
    const licensesResult = validateTotalLicenses(input.totalLicenses);
    if (E.isLeft(licensesResult)) return licensesResult;
  }

  // 如果有过期日期，验证
  if (input.expiryDate !== undefined) {
    const dateResult = validateFutureDate(input.expiryDate);
    if (E.isLeft(dateResult)) return dateResult;
  }

  // 如果有状态，验证
  if (input.status !== undefined && !isValidStatus(input.status)) {
    return failure('Invalid subscription status');
  }

  return success(input);
};

// ============= 创建函数 =============

/**
 * 创建新订阅（纯函数）
 */
export const createSubscription = (input: CreateSubscriptionInput): Subscription => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: input.name,
    totalLicenses: input.totalLicenses,
    usedLicenses: 0,
    status: 'active',
    expiryDate: input.expiryDate,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * 更新订阅（纯函数）
 */
export const updateSubscription = (
  subscription: Subscription,
  updates: UpdateSubscriptionInput
): Subscription => ({
  ...subscription,
  name: updates.name ?? subscription.name,
  totalLicenses: updates.totalLicenses ?? subscription.totalLicenses,
  status: updates.status ?? subscription.status,
  expiryDate: updates.expiryDate ?? subscription.expiryDate,
  updatedAt: new Date().toISOString(),
});

/**
 * 增加已使用许可数（纯函数）
 */
export const incrementUsedLicenses = (subscription: Subscription): Subscription => ({
  ...subscription,
  usedLicenses: subscription.usedLicenses + 1,
  updatedAt: new Date().toISOString(),
});

/**
 * 减少已使用许可数（纯函数）
 */
export const decrementUsedLicenses = (subscription: Subscription): Subscription => ({
  ...subscription,
  usedLicenses: Math.max(0, subscription.usedLicenses - 1),
  updatedAt: new Date().toISOString(),
});

/**
 * 更新订阅状态为过期（纯函数）
 */
export const markAsExpired = (subscription: Subscription): Subscription => ({
  ...subscription,
  status: 'expired',
  updatedAt: new Date().toISOString(),
});

// ============= 业务规则 =============

/**
 * 检查是否可以分配许可
 */
export const canAssignLicense = (subscription: Subscription): Result<Error, Subscription> =>
  !isActive(subscription)
    ? failure('Subscription is not active')
    : !hasAvailableLicenses(subscription)
    ? failure('No available licenses')
    : success(subscription);

/**
 * 检查是否可以减少许可总数
 */
export const canReduceTotalLicenses = (
  subscription: Subscription,
  newTotal: number
): Result<Error, Subscription> =>
  newTotal < subscription.usedLicenses
    ? failure('Cannot reduce total licenses below used licenses')
    : success(subscription);

/**
 * 检查订阅是否过期
 */
export const checkExpiry = (subscription: Subscription): Subscription =>
  new Date(subscription.expiryDate) <= new Date() && subscription.status === 'active'
    ? markAsExpired(subscription)
    : subscription;
