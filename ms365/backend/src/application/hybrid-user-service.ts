/**
 * 混合用户服务
 * 根据配置自动切换本地数据库或 Microsoft Graph API
 */

import type { Either } from 'fp-ts/Either';
import { E } from '../utils/fp.js';
import type { User, CreateUserInput, UpdateUserInput } from '../../../shared/types.js';
import type { UserService } from './user-service.js';
import type { GraphUserService, VerifiedDomain } from '../infrastructure/graph/user-service.js';
import type { HybridSubscriptionService } from './hybrid-subscription-service.js';
import type { AppMode } from '../config/index.js';

export interface HybridUserService {
  readonly getAllUsers: () => Promise<Either<Error, readonly User[]>>;
  readonly getUserById: (id: string) => Promise<Either<Error, User>>;
  readonly getUserByEmail: (email: string) => Promise<Either<Error, User>>;
  readonly createUser: (input: CreateUserInput) => Promise<Either<Error, User>>;
  readonly updateUser: (id: string, updates: UpdateUserInput) => Promise<Either<Error, User>>;
  readonly assignSubscription: (
    userId: string,
    subscriptionId: string
  ) => Promise<Either<Error, User>>;
  readonly revokeSubscription: (userId: string) => Promise<Either<Error, User>>;
  readonly getVerifiedDomains: () => Promise<Either<Error, readonly VerifiedDomain[]>>;
  readonly getAvailableRoles: () => Promise<Either<Error, readonly { id: string; displayName: string; description: string }[]>>;
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
 * 为用户填充订阅名称
 */
const enrichUserWithSubscriptionName = async (
  user: User,
  subscriptionService: HybridSubscriptionService
): Promise<User> => {
  if (!user.subscriptionId) {
    return user;
  }

  const subResult = await subscriptionService.getSubscriptionById(user.subscriptionId);
  if (E.isRight(subResult)) {
    return {
      ...user,
      subscriptionName: subResult.right.name,
    };
  }

  return user;
};

/**
 * 创建混合用户服务
 */
export const createHybridUserService = (
  mode: AppMode,
  localService: UserService,
  graphService: GraphUserService | null,
  subscriptionService: HybridSubscriptionService
): HybridUserService => {
  const isProduction = mode === 'production';
  const useGraph = isProduction && graphService !== null;

  if (isProduction && !graphService) {
    console.warn(
      '⚠️  Warning: APP_MODE is "production" but Graph service is not configured. Falling back to local database.'
    );
  }

  /**
   * 获取所有用户
   */
  const getAllUsers = async (): Promise<Either<Error, readonly User[]>> => {
    let usersResult: Either<Error, readonly User[]>;

    if (useGraph && graphService) {
      console.log('🔵 [HybridService] Fetching users from Microsoft Graph API');
      usersResult = mapGraphError(await graphService.findAll());
    } else {
      console.log('🟡 [HybridService] Fetching users from local database');
      usersResult = await localService.getAllUsers();
    }

    if (E.isLeft(usersResult)) {
      return usersResult;
    }

    // 为每个用户填充订阅名称
    const enrichedUsers = await Promise.all(
      usersResult.right.map((user) => enrichUserWithSubscriptionName(user, subscriptionService))
    );

    return E.right(enrichedUsers);
  };

  /**
   * 根据 ID 获取用户
   */
  const getUserById = async (id: string): Promise<Either<Error, User>> => {
    let userResult: Either<Error, User>;

    if (useGraph && graphService) {
      userResult = mapGraphError(await graphService.findById(id));
    } else {
      userResult = await localService.getUserById(id);
    }

    if (E.isLeft(userResult)) {
      return userResult;
    }

    // 填充订阅名称
    const enrichedUser = await enrichUserWithSubscriptionName(userResult.right, subscriptionService);
    return E.right(enrichedUser);
  };

  /**
   * 根据邮箱获取用户
   */
  const getUserByEmail = async (email: string): Promise<Either<Error, User>> => {
    // Graph API 暂不支持
    if (useGraph) {
      return E.left(new Error('Get user by email is not supported in Graph mode'));
    }
    return localService.getUserByEmail(email);
  };

  /**
   * 创建用户
   */
  const createUser = async (input: CreateUserInput): Promise<Either<Error, User>> => {
    let result: Either<Error, User>;

    if (useGraph && graphService) {
      result = mapGraphError(await graphService.create(input));

      // 如果创建成功且指定了目录角色，则分配角色
      if (E.isRight(result) && input.directoryRoleTemplateId) {
        console.log(`🔵 [HybridService] Assigning directory role to newly created user`);
        const roleResult = mapGraphError(await graphService.assignDirectoryRole(
          result.right.id,
          input.directoryRoleTemplateId
        ));

        if (E.isLeft(roleResult)) {
          console.warn('⚠️ [HybridService] Failed to assign directory role, but user was created');
          // 不返回错误，用户已创建成功
        } else {
          console.log(`✅ [HybridService] Directory role assigned successfully`);
        }
      }

      return result;
    }

    return localService.createUser(input);
  };

  /**
   * 更新用户
   */
  const updateUser = async (
    id: string,
    updates: UpdateUserInput
  ): Promise<Either<Error, User>> => {
    if (useGraph && graphService) {
      // 如果有角色模板 ID，先分配角色
      if (updates.directoryRoleTemplateId) {
        console.log(`🔵 [HybridService] Assigning directory role on update: ${updates.directoryRoleTemplateId}`);
        const roleResult = mapGraphError(await graphService.assignDirectoryRole(
          id,
          updates.directoryRoleTemplateId
        ));

        if (E.isLeft(roleResult)) {
          console.warn('⚠️ [HybridService] Failed to assign directory role during update');
          // 可以选择返回错误，或者继续更新其他属性
          // 这里我们选择继续，但记录警告
        }
      }

      return mapGraphError(await graphService.update(id, updates));
    }
    return localService.updateUser(id, updates);
  };

  /**
   * 分配订阅
   */
  const assignSubscription = async (
    userId: string,
    subscriptionId: string
  ): Promise<Either<Error, User>> => {
    let result: Either<Error, User>;

    if (useGraph && graphService) {
      console.log(`🔵 [HybridService] Assigning license via Microsoft Graph API`);
      result = mapGraphError(await graphService.assignLicense(userId, subscriptionId));
    } else {
      console.log(`🟡 [HybridService] Assigning subscription via local database`);
      result = await localService.assignSubscription(userId, subscriptionId);
    }

    if (E.isLeft(result)) {
      return result;
    }

    // 填充订阅名称
    const enrichedUser = await enrichUserWithSubscriptionName(result.right, subscriptionService);
    return E.right(enrichedUser);
  };

  /**
   * 撤销订阅
   */
  const revokeSubscription = async (userId: string): Promise<Either<Error, User>> => {
    // 首先获取用户的当前订阅ID和角色
    const userResult = await getUserById(userId);
    if (E.isLeft(userResult)) {
      return userResult;
    }

    const user = userResult.right;

    // 检查是否为管理员用户
    if (user.role === 'admin' || user.role === 'super_admin') {
      return E.left(new Error('Cannot revoke subscription from admin users'));
    }

    const currentSubscriptionId = user.subscriptionId;
    if (!currentSubscriptionId) {
      return E.left(new Error('User does not have any subscription assigned'));
    }

    let result: Either<Error, User>;

    if (useGraph && graphService) {
      console.log(`🔵 [HybridService] Revoking license via Microsoft Graph API`);
      result = mapGraphError(await graphService.revokeLicense(userId, currentSubscriptionId));
    } else {
      console.log(`🟡 [HybridService] Revoking subscription via local database`);
      result = await localService.revokeSubscription(userId);
    }

    if (E.isLeft(result)) {
      return result;
    }

    // 用户已经没有订阅了，直接返回
    return E.right(result.right);
  };

  /**
   * 获取已验证的域名
   */
  const getVerifiedDomains = async (): Promise<Either<Error, readonly VerifiedDomain[]>> => {
    if (useGraph && graphService) {
      return mapGraphError(await graphService.getVerifiedDomains());
    }
    return E.left(new Error('Verified domains are only available in production mode with Graph API'));
  };

  /**
   * 获取可用角色
   */
  const getAvailableRoles = async (): Promise<Either<Error, readonly { id: string; displayName: string; description: string }[]>> => {
    if (useGraph && graphService) {
      // 使用 Graph API 获取角色
      return mapGraphError(await graphService.getDirectoryRoles());
    } else {
      // 使用本地服务获取角色 (注意：本地服务现在也返回对象结构，虽然是 mock 的)
      return localService.getAvailableRoles();
    }
  };

  return {
    getAllUsers,
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    assignSubscription,
    revokeSubscription,
    getVerifiedDomains,
    getAvailableRoles,
  };
};
