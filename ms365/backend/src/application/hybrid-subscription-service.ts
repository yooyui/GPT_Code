/**
 * 混合订阅服务
 * 根据配置自动切换本地数据库或 Microsoft Graph API
 */

import type { Either } from 'fp-ts/Either';
import { E } from '../utils/fp.js';
import type { Subscription, CreateSubscriptionInput, UpdateSubscriptionInput } from '../../../shared/types.js';
import type { SubscriptionService } from './subscription-service.js';
import type { GraphSubscriptionService } from '../infrastructure/graph/subscription-service.js';
import type { AppMode } from '../config/index.js';

export interface HybridSubscriptionService {
  readonly getAllSubscriptions: () => Promise<Either<Error, readonly Subscription[]>>;
  readonly getSubscriptionById: (id: string) => Promise<Either<Error, Subscription>>;
  readonly createSubscription: (input: CreateSubscriptionInput) => Promise<Either<Error, Subscription>>;
  readonly updateSubscription: (
    id: string,
    updates: UpdateSubscriptionInput
  ) => Promise<Either<Error, Subscription>>;
  readonly assignLicense: (
    subscriptionId: string,
    userId: string
  ) => Promise<Either<Error, Subscription>>;
  readonly revokeLicense: (
    subscriptionId: string,
    userId: string
  ) => Promise<Either<Error, Subscription>>;
}

/**
 * 将 Either<GraphError, T> 转换为 Either<Error, T>
 */
const mapGraphError = <T>(result: Either<any, T>): Either<Error, T> => {
  if (E.isLeft(result)) {
    return E.left(new Error(result.left.message));
  }
  return result as Either<Error, T>;
};

/**
 * 创建混合订阅服务
 */
export const createHybridSubscriptionService = (
  mode: AppMode,
  localService: SubscriptionService,
  graphService: GraphSubscriptionService | null
): HybridSubscriptionService => {
  const isProduction = mode === 'production';
  const useGraph = isProduction && graphService !== null;

  if (isProduction && !graphService) {
    console.warn(
      '⚠️  Warning: APP_MODE is "production" but Graph subscription service is not configured. Falling back to local database.'
    );
  }

  /**
   * 获取所有订阅
   */
  const getAllSubscriptions = async (): Promise<Either<Error, readonly Subscription[]>> => {
    if (useGraph && graphService) {
      console.log('🔵 [HybridSubscriptionService] Fetching subscriptions from Microsoft Graph API');
      return mapGraphError(await graphService.findAll());
    }
    console.log('🟡 [HybridSubscriptionService] Fetching subscriptions from local database');
    return localService.getAllSubscriptions();
  };

  /**
   * 根据 ID 获取订阅
   */
  const getSubscriptionById = async (id: string): Promise<Either<Error, Subscription>> => {
    if (useGraph && graphService) {
      // Graph API 不支持按 ID 查询单个订阅，需要先获取所有再过滤
      const result = await graphService.findAll();
      if (E.isLeft(result)) {
        return mapGraphError(result);
      }
      const subscription = result.right.find(s => s.id === id);
      if (!subscription) {
        return E.left(new Error(`Subscription with ID ${id} not found`));
      }
      return E.right(subscription);
    }
    return localService.getSubscriptionById(id);
  };

  /**
   * 创建订阅（仅本地模式支持）
   */
  const createSubscription = async (input: CreateSubscriptionInput): Promise<Either<Error, Subscription>> => {
    if (useGraph) {
      return E.left(
        new Error(
          'Creating subscriptions via Graph API is not supported. Subscriptions are managed in Microsoft 365 Admin Center.'
        )
      );
    }
    return localService.createSubscription(input);
  };

  /**
   * 更新订阅（仅本地模式支持）
   */
  const updateSubscription = async (
    id: string,
    updates: UpdateSubscriptionInput
  ): Promise<Either<Error, Subscription>> => {
    if (useGraph) {
      return E.left(
        new Error(
          'Updating subscriptions via Graph API is not supported. Subscriptions are managed in Microsoft 365 Admin Center.'
        )
      );
    }
    return localService.updateSubscription(id, updates);
  };

  /**
   * 分配许可证（仅本地模式支持）
   */
  const assignLicense = async (
    subscriptionId: string,
    userId: string
  ): Promise<Either<Error, Subscription>> => {
    if (useGraph) {
      return E.left(
        new Error(
          'License assignment via Graph API is not implemented yet. Use Azure Portal or PowerShell.'
        )
      );
    }
    return localService.assignLicense(subscriptionId, userId);
  };

  /**
   * 撤销许可证（仅本地模式支持）
   */
  const revokeLicense = async (
    subscriptionId: string,
    userId: string
  ): Promise<Either<Error, Subscription>> => {
    if (useGraph) {
      return E.left(
        new Error(
          'License revocation via Graph API is not implemented yet. Use Azure Portal or PowerShell.'
        )
      );
    }
    return localService.revokeLicense(subscriptionId, userId);
  };

  return {
    getAllSubscriptions,
    getSubscriptionById,
    createSubscription,
    updateSubscription,
    assignLicense,
    revokeLicense,
  };
};
