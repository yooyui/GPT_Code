/**
 * 用户领域模型
 * 遵循函数式编程：纯函数、不可变性、类型安全
 */

import { v4 as uuidv4 } from 'uuid';
import type { User, UserRole, CreateUserInput, UpdateUserInput } from '../../../shared/types.js';
import { pipe, E, validateEmail, validateNonEmpty, success, failure } from '../utils/fp.js';
import type { Result } from '../utils/fp.js';

// ============= 类型守卫 =============

/**
 * 可用的用户角色列表
 */
export const AVAILABLE_ROLES: UserRole[] = ['super_admin', 'admin', 'readonly'];

/**
 * 检查是否为有效的用户角色
 */
export const isValidUserRole = (role: string): role is UserRole =>
  AVAILABLE_ROLES.includes(role as UserRole);

/**
 * 检查是否为管理员用户
 */
export const isAdmin = (user: User): boolean =>
  user.role === 'super_admin' || user.role === 'admin';

/**
 * 检查是否为超级管理员
 */
export const isSuperAdmin = (user: User): boolean =>
  user.role === 'super_admin';

// ============= 验证函数 =============

/**
 * 验证用户名
 */
const validateUserName = (name: string): Result<Error, string> =>
  pipe(
    validateNonEmpty(name, 'User name'),
    E.chain((n) =>
      n.length >= 2 && n.length <= 100
        ? success(n)
        : failure('User name must be between 2 and 100 characters')
    )
  );

/**
 * 验证用户角色
 */
const validateRole = (role: string): Result<Error, UserRole> =>
  isValidUserRole(role)
    ? success(role)
    : failure('Invalid user role');

/**
 * 验证创建用户输入
 */
export const validateCreateUserInput = (
  input: CreateUserInput
): Result<Error, CreateUserInput> => {
  // 验证邮箱
  const emailResult = validateEmail(input.email);
  if (E.isLeft(emailResult)) return emailResult;

  // 验证名称
  const nameResult = validateUserName(input.name);
  if (E.isLeft(nameResult)) return nameResult;

  // 验证角色
  const roleResult = validateRole(input.role);
  if (E.isLeft(roleResult)) return roleResult;

  return success(input);
};

/**
 * 验证更新用户输入
 */
export const validateUpdateUserInput = (
  input: UpdateUserInput
): Result<Error, UpdateUserInput> => {
  // 如果有名称，验证名称
  if (input.name !== undefined) {
    const nameResult = validateUserName(input.name);
    if (E.isLeft(nameResult)) return nameResult;
  }

  // 如果有角色，验证角色
  if (input.role !== undefined) {
    const roleResult = validateRole(input.role);
    if (E.isLeft(roleResult)) return roleResult;
  }

  return success(input);
};

// ============= 创建函数 =============

/**
 * 创建新用户（纯函数）
 */
export const createUser = (input: CreateUserInput): User => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    email: input.email,
    name: input.name,
    role: input.role,
    subscriptionId: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * 更新用户（纯函数，返回新用户对象）
 */
export const updateUser = (user: User, updates: UpdateUserInput): User => ({
  ...user,
  name: updates.name ?? user.name,
  role: updates.role ?? user.role,
  isActive: updates.isActive ?? user.isActive,
  updatedAt: new Date().toISOString(),
});

/**
 * 分配订阅给用户（纯函数）
 */
export const assignSubscription = (
  user: User,
  subscriptionId: string
): User => ({
  ...user,
  subscriptionId,
  updatedAt: new Date().toISOString(),
});

/**
 * 回收用户订阅（纯函数）
 */
export const revokeSubscription = (user: User): User => ({
  ...user,
  subscriptionId: null,
  updatedAt: new Date().toISOString(),
});

/**
 * 停用用户（纯函数）
 */
export const deactivateUser = (user: User): User => ({
  ...user,
  isActive: false,
  updatedAt: new Date().toISOString(),
});

/**
 * 激活用户（纯函数）
 */
export const activateUser = (user: User): User => ({
  ...user,
  isActive: true,
  updatedAt: new Date().toISOString(),
});

// ============= 业务规则 =============

/**
 * 检查用户是否可以被删除
 * 管理员用户不能被删除
 */
export const canDeleteUser = (user: User): Result<Error, User> =>
  isAdmin(user)
    ? failure('Cannot delete admin user')
    : success(user);

/**
 * 检查用户是否可以被分配订阅
 */
export const canAssignSubscription = (user: User): Result<Error, User> =>
  user.subscriptionId !== null
    ? failure('User already has a subscription')
    : !user.isActive
      ? failure('Cannot assign subscription to inactive user')
      : success(user);

/**
 * 检查用户是否可以回收订阅
 */
export const canRevokeSubscription = (user: User): Result<Error, User> =>
  user.subscriptionId === null
    ? failure('User has no subscription to revoke')
    : success(user);
