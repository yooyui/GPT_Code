/**
 * 订阅服务层
 * 使用函数式管道组合领域逻辑和数据库操作
 */

import { pipe, E } from '../utils/fp.js';
import type { Result } from '../utils/fp.js';
import type { SubscriptionRepository, UserRepository } from '../infrastructure/database/sqlite.js';
import type {
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../../../shared/types.js';
import * as SubDomain from '../domain/subscription.js';
import { failure } from '../utils/fp.js';

// ============= 服务接口 =============

export interface SubscriptionService {
  readonly getAllSubscriptions: () => Promise<Result<Error, readonly Subscription[]>>;
  readonly getSubscriptionById: (id: string) => Promise<Result<Error, Subscription>>;
  readonly createSubscription: (input: CreateSubscriptionInput) => Promise<Result<Error, Subscription>>;
  readonly updateSubscription: (
    id: string,
    updates: UpdateSubscriptionInput
  ) => Promise<Result<Error, Subscription>>;
  readonly assignLicense: (
    subscriptionId: string,
    userId: string
  ) => Promise<Result<Error, Subscription>>;
  readonly revokeLicense: (
    subscriptionId: string,
    userId: string
  ) => Promise<Result<Error, Subscription>>;
}

// ============= 服务实现 =============

export const createSubscriptionService = (
  subscriptionRepo: SubscriptionRepository,
  userRepo: UserRepository
): SubscriptionService => ({
  /**
   * 获取所有订阅
   */
  getAllSubscriptions: async () => {
    const result = subscriptionRepo.findAll();
    // 检查并更新过期状态
    return pipe(
      result,
      E.map((subs) => subs.map(SubDomain.checkExpiry))
    );
  },

  /**
   * 根据ID获取订阅
   */
  getSubscriptionById: async (id: string) => {
    return pipe(
      subscriptionRepo.findById(id),
      E.chain((sub) =>
        sub === null ? failure('Subscription not found') : E.right(sub)
      ),
      E.map(SubDomain.checkExpiry)
    );
  },

  /**
   * 创建订阅
   * 函数式管道：验证输入 -> 创建订阅 -> 保存
   */
  createSubscription: async (input: CreateSubscriptionInput) => {
    return pipe(
      // 1. 验证输入
      SubDomain.validateCreateSubscriptionInput(input),
      E.chain(() => {
        // 2. 创建订阅
        const subscription = SubDomain.createSubscription(input);
        // 3. 保存
        return subscriptionRepo.create(subscription);
      })
    );
  },

  /**
   * 更新订阅
   * 函数式管道：验证输入 -> 获取订阅 -> 检查约束 -> 应用更新 -> 保存
   */
  updateSubscription: async (id: string, updates: UpdateSubscriptionInput) => {
    return pipe(
      // 1. 验证输入
      SubDomain.validateUpdateSubscriptionInput(updates),
      E.chain(() =>
        // 2. 获取订阅
        pipe(
          subscriptionRepo.findById(id),
          E.chain((sub) =>
            sub === null ? failure('Subscription not found') : E.right(sub)
          )
        )
      ),
      E.chain((subscription) => {
        // 3. 检查许可证总数约束
        if (
          updates.totalLicenses !== undefined &&
          updates.totalLicenses < subscription.usedLicenses
        ) {
          return failure('Cannot reduce total licenses below used licenses');
        }

        // 4. 应用更新
        const updated = SubDomain.updateSubscription(subscription, updates);

        // 5. 保存
        return subscriptionRepo.update(updated);
      })
    );
  },

  /**
   * 分配许可证
   * 函数式管道：获取订阅 -> 检查可用性 -> 增加计数 -> 更新用户 -> 保存
   */
  assignLicense: async (subscriptionId: string, userId: string) => {
    return pipe(
      // 1. 获取订阅
      subscriptionRepo.findById(subscriptionId),
      E.chain((sub) =>
        sub === null ? failure('Subscription not found') : E.right(sub)
      ),
      // 2. 检查是否可分配许可
      E.chain(SubDomain.canAssignLicense),
      // 3. 增加已使用许可数
      E.map(SubDomain.incrementUsedLicenses),
      // 4. 保存订阅
      E.chain((subscription) =>
        pipe(
          subscriptionRepo.update(subscription),
          // 5. 更新用户的订阅ID（这里假设在user-service中已处理）
          E.map(() => subscription)
        )
      )
    );
  },

  /**
   * 回收许可证
   * 函数式管道：获取订阅 -> 减少计数 -> 更新用户 -> 保存
   */
  revokeLicense: async (subscriptionId: string, userId: string) => {
    return pipe(
      // 1. 获取订阅
      subscriptionRepo.findById(subscriptionId),
      E.chain((sub) =>
        sub === null ? failure('Subscription not found') : E.right(sub)
      ),
      // 2. 减少已使用许可数
      E.map(SubDomain.decrementUsedLicenses),
      // 3. 保存订阅
      E.chain((subscription) =>
        pipe(
          subscriptionRepo.update(subscription),
          // 4. 更新用户的订阅ID（这里假设在user-service中已处理）
          E.map(() => subscription)
        )
      )
    );
  },
});
