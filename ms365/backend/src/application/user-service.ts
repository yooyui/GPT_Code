/**
 * 用户服务层
 * 使用函数式管道组合领域逻辑和数据库操作
 */

import { pipe, E } from '../utils/fp.js';
import type { Result } from '../utils/fp.js';
import type { UserRepository } from '../infrastructure/database/sqlite.js';
import type { GraphUserService } from '../infrastructure/graph/user-service.js';
import type { User, CreateUserInput, UpdateUserInput } from '../../../shared/types.js';
import * as UserDomain from '../domain/user.js';
import { AVAILABLE_ROLES } from '../domain/user.js';
import { failure, success } from '../utils/fp.js';

// ============= 服务接口 =============

export interface UserService {
  readonly getAllUsers: () => Promise<Result<Error, readonly User[]>>;
  readonly getUserById: (id: string) => Promise<Result<Error, User>>;
  readonly getUserByEmail: (email: string) => Promise<Result<Error, User>>;
  readonly createUser: (input: CreateUserInput) => Promise<Result<Error, User>>;
  readonly updateUser: (id: string, updates: UpdateUserInput) => Promise<Result<Error, User>>;
  readonly assignSubscription: (userId: string, subscriptionId: string) => Promise<Result<Error, User>>;
  readonly revokeSubscription: (userId: string) => Promise<Result<Error, User>>;
  readonly getAvailableRoles: () => Promise<Result<Error, readonly { id: string; displayName: string; description: string }[]>>;
  readonly getVerifiedDomains: () => Promise<Result<Error, readonly { name: string; isDefault: boolean; isInitial: boolean }[]>>;
}

// ============= 服务实现 =============

export const createUserService = (
  userRepo: UserRepository,
  graphUserService: GraphUserService
): UserService => ({
  /**
   * 获取所有用户
   */
  getAllUsers: async () => {
    return userRepo.findAll();
  },

  /**
   * 根据ID获取用户
   */
  getUserById: async (id: string) => {
    const result = userRepo.findById(id);
    return pipe(
      result,
      E.chain((user) =>
        user === null ? failure('User not found') : E.right(user)
      )
    );
  },

  /**
   * 根据邮箱获取用户
   */
  getUserByEmail: async (email: string) => {
    const result = userRepo.findByEmail(email);
    return pipe(
      result,
      E.chain((user) =>
        user === null ? failure('User not found') : E.right(user)
      )
    );
  },

  /**
   * 创建用户
   * 函数式管道：验证输入 -> 检查邮箱唯一性 -> 创建用户 -> 保存到数据库
   */
  createUser: async (input: CreateUserInput) => {
    // 1. 验证输入
    const validationResult = UserDomain.validateCreateUserInput(input);
    if (E.isLeft(validationResult)) return validationResult;

    // 2. 检查邮箱是否已存在
    const existingResult = userRepo.findByEmail(input.email);
    if (E.isLeft(existingResult)) return existingResult;

    const existing = existingResult.right;
    if (existing !== null) {
      return failure('Email already exists');
    }

    // 3. 创建用户
    const user = UserDomain.createUser(input);

    // 4. 保存到数据库
    return userRepo.create(user);
  },

  /**
   * 更新用户
   * 函数式管道：验证输入 -> 获取用户 -> 应用更新 -> 保存
   */
  updateUser: async (id: string, updates: UpdateUserInput) => {
    return pipe(
      // 1. 验证输入
      UserDomain.validateUpdateUserInput(updates),
      E.chain(() =>
        // 2. 获取用户
        pipe(
          userRepo.findById(id),
          E.chain((user) =>
            user === null ? failure('User not found') : E.right(user)
          )
        )
      ),
      E.chain((user) => {
        // 3. 应用更新
        const updatedUser = UserDomain.updateUser(user, updates);
        // 4. 保存
        return userRepo.update(updatedUser);
      })
    );
  },

  /**
   * 分配订阅
   * 函数式管道：获取用户 -> 检查是否可分配 -> 分配 -> 保存
   */
  assignSubscription: async (userId: string, subscriptionId: string) => {
    return pipe(
      // 1. 获取用户
      userRepo.findById(userId),
      E.chain((user) =>
        user === null ? failure('User not found') : E.right(user)
      ),
      // 2. 检查是否可分配订阅
      E.chain(UserDomain.canAssignSubscription),
      // 3. 分配订阅
      E.map((user) => UserDomain.assignSubscription(user, subscriptionId)),
      // 4. 保存
      E.chain((user) => userRepo.update(user))
    );
  },

  /**
   * 回收订阅
   * 函数式管道：获取用户 -> 检查是否可回收 -> 回收 -> 保存
   */
  revokeSubscription: async (userId: string) => {
    return pipe(
      // 1. 获取用户
      userRepo.findById(userId),
      E.chain((user) =>
        user === null ? failure('User not found') : E.right(user)
      ),
      // 2. 检查是否可回收订阅
      E.chain(UserDomain.canRevokeSubscription),
      // 3. 回收订阅
      E.map(UserDomain.revokeSubscription),
      // 4. 保存
      E.chain((user) => userRepo.update(user))
    );
  },

  /**
   * 获取可用角色 (从 Graph API)
   */
  getAvailableRoles: async () => {
    return pipe(
      await graphUserService.getDirectoryRoles(),
      E.mapLeft((error: any) => new Error(error.message || 'Unknown error'))
    );
  },

  /**
   * 获取已验证域名 (Mock)
   */
  getVerifiedDomains: async () => {
    return success([
      { name: 'example.com', isDefault: true, isInitial: true },
      { name: 'contoso.com', isDefault: false, isInitial: false }
    ]);
  },
});
