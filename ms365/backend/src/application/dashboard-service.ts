/**
 * 仪表板统计服务
 * 提供系统统计数据
 */

import { pipe, E } from '../utils/fp.js';
import type { Result } from '../utils/fp.js';
import type { DashboardStats } from '../../../shared/types.js';
import type { HybridUserService } from './hybrid-user-service.js';
import type { HybridSubscriptionService } from './hybrid-subscription-service.js';

// ============= 服务接口 =============

export interface DashboardService {
  readonly getStats: () => Promise<Result<Error, DashboardStats>>;
}

// ============= 服务实现 =============

export const createDashboardService = (
  userService: HybridUserService,
  subscriptionService: HybridSubscriptionService
): DashboardService => ({
  /**
   * 获取仪表板统计数据
   * 函数式组合：并行获取所有数据 -> 计算统计值
   */
  getStats: async () => {
    // 获取所有用户（从混合服务，可能来自 Graph API）
    const usersResult = await userService.getAllUsers();
    if (E.isLeft(usersResult)) return usersResult;
    const users = usersResult.right;

    // 获取所有订阅（从混合服务，可能来自 Graph API）
    const subscriptionsResult = await subscriptionService.getAllSubscriptions();
    if (E.isLeft(subscriptionsResult)) return subscriptionsResult;
    const subscriptions = subscriptionsResult.right;

    // 计算统计数据（纯函数）
    const stats: DashboardStats = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
      totalLicenses: subscriptions.reduce((sum, s) => sum + s.totalLicenses, 0),
      usedLicenses: subscriptions.reduce((sum, s) => sum + s.usedLicenses, 0),
      availableLicenses: subscriptions.reduce(
        (sum, s) => sum + (s.totalLicenses - s.usedLicenses),
        0
      ),
      licenseUtilization: 0, // 稍后计算
    };

    // 计算许可证使用率
    stats.licenseUtilization =
      stats.totalLicenses > 0
        ? Number(((stats.usedLicenses / stats.totalLicenses) * 100).toFixed(2))
        : 0;

    return E.right(stats);
  },
});
