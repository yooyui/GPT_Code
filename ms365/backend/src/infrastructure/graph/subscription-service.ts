/**
 * Microsoft Graph 订阅（许可证）管理服务
 * 封装对 MS365 订阅的读取操作
 */

import type { Client } from '@microsoft/microsoft-graph-client';
import type { SubscribedSku } from '@microsoft/microsoft-graph-types';
import { E } from '../../utils/fp.js';
import type { Either } from 'fp-ts/Either';
import type { Subscription } from '../../../../shared/types.js';

export interface GraphError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

/**
 * 将 Graph SubscribedSku 转换为应用 Subscription 模型
 */
const mapSubscribedSkuToSubscription = (sku: SubscribedSku): Subscription => {
  // SKU 名称映射
  const skuNameMap: Record<string, string> = {
    'O365_BUSINESS_ESSENTIALS': 'Microsoft 365 Business Basic',
    'O365_BUSINESS_PREMIUM': 'Microsoft 365 Business Standard',
    'SPE_E3': 'Microsoft 365 E3',
    'SPE_E5': 'Microsoft 365 E5',
    'ENTERPRISEPACK': 'Office 365 E3',
    'ENTERPRISEPREMIUM': 'Office 365 E5',
    'POWER_BI_STANDARD': 'Power BI Pro',
  };

  const skuPartNumber = sku.skuPartNumber || 'UNKNOWN';
  const displayName = skuNameMap[skuPartNumber] || sku.skuPartNumber || 'Unknown License';

  const prepaidUnits = sku.prepaidUnits || { enabled: 0 };
  const consumedUnits = sku.consumedUnits || 0;
  const totalLicenses = (prepaidUnits.enabled || 0) + (prepaidUnits.warning || 0);

  // Graph API 不提供过期日期，使用空字符串表示无限期
  const expiryDate = '';

  return {
    id: sku.skuId || '',
    name: displayName,
    totalLicenses,
    usedLicenses: consumedUnits,
    status: (sku.capabilityStatus === 'Enabled' ? 'active' : 'expired') as 'active' | 'expired',
    expiryDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Graph 订阅服务接口
 */
export interface GraphSubscriptionService {
  /**
   * 获取所有订阅（许可证）
   */
  readonly findAll: () => Promise<Either<GraphError, readonly Subscription[]>>;
}

/**
 * 创建 Graph 订阅服务
 */
export const createGraphSubscriptionService = (client: Client): GraphSubscriptionService => {
  /**
   * 获取所有订阅
   */
  const findAll = async (): Promise<Either<GraphError, readonly Subscription[]>> => {
    try {
      console.log('🔵 [GraphSubscriptionService] Fetching subscribedSkus from Microsoft Graph API');

      const response = await client
        .api('/subscribedSkus')
        .get();

      const subscriptions: readonly Subscription[] = (response.value as SubscribedSku[])
        .map(mapSubscribedSkuToSubscription)
        .filter(sub => sub.totalLicenses > 0); // 只返回有许可证的订阅

      console.log(`✅ [GraphSubscriptionService] Fetched ${subscriptions.length} subscriptions`);

      return E.right(subscriptions);
    } catch (error: any) {
      console.error('❌ [GraphSubscriptionService] Error:', error);
      return E.left({
        code: 'GRAPH_API_ERROR',
        message: 'Failed to fetch subscriptions from Microsoft Graph',
        details: error.message || error,
      });
    }
  };

  return {
    findAll,
  };
};
