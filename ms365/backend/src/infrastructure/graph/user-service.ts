/**
 * Microsoft Graph 用户管理服务
 * 封装对 MS365 用户的 CRUD 操作
 */

import type { Client } from '@microsoft/microsoft-graph-client';
import type { User as GraphUser } from '@microsoft/microsoft-graph-types';
import { E } from '../../utils/fp.js';
import type { Either } from 'fp-ts/Either';
import type { User, CreateUserInput, UpdateUserInput } from '../../../../shared/types.js';

export interface GraphError {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

/**
 * 从用户的目录角色确定应用角色
 */
const determineUserRole = (graphUser: any): 'super_admin' | 'admin' | 'readonly' => {
  // 如果用户有 memberOf 信息，检查目录角色
  if (graphUser.memberOf && Array.isArray(graphUser.memberOf)) {
    for (const group of graphUser.memberOf) {
      const displayName = group.displayName?.toLowerCase() || '';
      const roleTemplateId = group.roleTemplateId || '';

      // 检查是否是全局管理员 (Global Administrator)
      // roleTemplateId: 62e90394-69f5-4237-9190-012177145e10
      if (roleTemplateId === '62e90394-69f5-4237-9190-012177145e10' ||
        displayName.includes('global administrator') ||
        displayName.includes('company administrator')) {
        return 'super_admin';
      }

      // 检查是否是用户管理员或其他管理员角色
      if (displayName.includes('administrator') || displayName.includes('admin')) {
        return 'admin';
      }
    }
  }

  // 默认为只读用户
  return 'readonly';
};

/**
 * 将 Graph User 转换为应用 User 模型
 */
const mapGraphUserToUser = (graphUser: GraphUser & { memberOf?: any[] | null }): User => {
  // 从 assignedLicenses 中提取第一个许可证的 skuId
  let subscriptionId: string | null = null;
  if (graphUser.assignedLicenses && graphUser.assignedLicenses.length > 0) {
    // 优先获取启用的许可证
    const enabledLicense = graphUser.assignedLicenses.find(
      (license) => license.skuId && license.disabledPlans?.length === 0
    );
    subscriptionId = enabledLicense?.skuId || graphUser.assignedLicenses[0]?.skuId || null;
  }

  // 从 Graph API 获取角色信息
  const role = determineUserRole(graphUser);

  // 提取 Azure 角色模板 ID（优先使用具体的目录角色）
  let azureRoleTemplateId: string | null = null;
  if (graphUser.memberOf && Array.isArray(graphUser.memberOf)) {
    for (const group of graphUser.memberOf) {
      const roleTemplateId = group.roleTemplateId || '';
      if (roleTemplateId) {
        azureRoleTemplateId = roleTemplateId;
        break; // 使用第一个找到的角色模板 ID
      }
    }
  }

  return {
    id: graphUser.id || '',
    email: graphUser.userPrincipalName || graphUser.mail || '',
    name: graphUser.displayName || '',
    role,
    azureRoleTemplateId,
    subscriptionId,
    isActive: graphUser.accountEnabled || false,
    createdAt: graphUser.createdDateTime || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Graph 用户服务接口
 */
export interface VerifiedDomain {
  readonly name: string;
  readonly isDefault: boolean;
  readonly isInitial: boolean;
}

export interface DirectoryRoleTemplate {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

export interface GraphUserService {
  /**
   * 获取所有用户
   */
  readonly findAll: () => Promise<Either<GraphError, readonly User[]>>;

  /**
   * 根据 ID 获取用户
   */
  readonly findById: (id: string) => Promise<Either<GraphError, User>>;

  /**
   * 创建用户
   */
  readonly create: (input: CreateUserInput) => Promise<Either<GraphError, User>>;

  /**
   * 更新用户
   */
  readonly update: (
    id: string,
    updates: UpdateUserInput
  ) => Promise<Either<GraphError, User>>;

  /**
   * 检查用户是否存在
   */
  readonly exists: (id: string) => Promise<Either<GraphError, boolean>>;

  /**
   * 分配许可证给用户
   */
  readonly assignLicense: (userId: string, skuId: string) => Promise<Either<GraphError, User>>;

  /**
   * 撤销用户的许可证
   */
  readonly revokeLicense: (userId: string, skuId: string) => Promise<Either<GraphError, User>>;

  /**
   * 分配目录角色给用户
   */
  readonly assignDirectoryRole: (userId: string, roleTemplateId: string) => Promise<Either<GraphError, void>>;

  /**
   * 移除用户的所有目录角色（将用户降级为普通用户）
   */
  readonly removeAllDirectoryRoles: (userId: string) => Promise<Either<GraphError, void>>;

  /**
   * 获取组织的已验证域名
   */
  readonly getVerifiedDomains: () => Promise<Either<GraphError, readonly VerifiedDomain[]>>;

  /**
   * 获取目录角色模板
   */
  readonly getDirectoryRoles: () => Promise<Either<GraphError, readonly DirectoryRoleTemplate[]>>;
}

/**
 * 创建 Graph 用户服务
 */
export const createGraphUserService = (client: Client): GraphUserService => {
  /**
   * 获取所有用户
   */
  const findAll = async (): Promise<Either<GraphError, readonly User[]>> => {
    try {
      console.log('🔵 [GraphUserService] Fetching users with licenses and roles from Microsoft Graph API');

      const response = await client
        .api('/users')
        .select('id,userPrincipalName,displayName,mail,accountEnabled,createdDateTime,assignedLicenses')
        .expand('memberOf($select=id,displayName,roleTemplateId)')
        .top(999) // 获取最多 999 个用户
        .get();

      const users: readonly User[] = (response.value as GraphUser[]).map(mapGraphUserToUser);

      console.log(`✅ [GraphUserService] Fetched ${users.length} users`);
      console.log(`📊 [GraphUserService] Users with licenses: ${users.filter(u => u.subscriptionId).length}`);
      console.log(`👥 [GraphUserService] Admins: ${users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}`);

      return E.right(users);
    } catch (error: any) {
      console.error('❌ [GraphUserService] Error:', error);
      return E.left({
        code: 'GRAPH_API_ERROR',
        message: 'Failed to fetch users from Microsoft Graph',
        details: error.message || error,
      });
    }
  };

  /**
   * 根据 ID 获取用户
   */
  const findById = async (id: string): Promise<Either<GraphError, User>> => {
    try {
      const graphUser = await client
        .api(`/users/${id}`)
        .select('id,userPrincipalName,displayName,mail,accountEnabled,createdDateTime,assignedLicenses')
        .expand('memberOf($select=id,displayName,roleTemplateId)')
        .get();

      return E.right(mapGraphUserToUser(graphUser));
    } catch (error: any) {
      if (error.statusCode === 404) {
        return E.left({
          code: 'USER_NOT_FOUND',
          message: `User with ID ${id} not found`,
        });
      }
      return E.left({
        code: 'GRAPH_API_ERROR',
        message: 'Failed to fetch user from Microsoft Graph',
        details: error.message || error,
      });
    }
  };

  /**
   * 创建用户
   */
  const create = async (input: CreateUserInput): Promise<Either<GraphError, User>> => {
    try {
      console.log(`🔵 [GraphUserService] Creating user in Microsoft Graph: ${input.email}`);

      // 构建 Graph API 用户对象
      const newUser = {
        accountEnabled: true,
        displayName: input.name,
        mailNickname: input.email.split('@')[0],
        userPrincipalName: input.email,
        usageLocation: input.usageLocation || 'HK', // 使用传入的地区或默认香港，许可证分配必需
        passwordProfile: {
          forceChangePasswordNextSignIn: true,
          password: generateTemporaryPassword(),
        },
      };

      const createdUser = await client.api('/users').post(newUser);
      const userId = createdUser.id;

      console.log(`✅ [GraphUserService] User created successfully, ID: ${userId}`);

      // 重新获取用户信息，包含 memberOf 以确定角色
      const userWithRoles = await client
        .api(`/users/${userId}`)
        .select('id,userPrincipalName,displayName,mail,accountEnabled,createdDateTime,assignedLicenses')
        .expand('memberOf($select=id,displayName,roleTemplateId)')
        .get();

      return E.right(mapGraphUserToUser(userWithRoles));
    } catch (error: any) {
      console.error('❌ [GraphUserService] Failed to create user:', error);
      return E.left({
        code: 'GRAPH_API_ERROR',
        message: 'Failed to create user in Microsoft Graph',
        details: error.message || error,
      });
    }
  };

  /**
   * 更新用户
   */
  const update = async (
    id: string,
    updates: UpdateUserInput
  ): Promise<Either<GraphError, User>> => {
    try {
      // 构建更新对象
      const updatePayload: any = {};

      if (updates.name !== undefined) {
        updatePayload.displayName = updates.name;
      }

      if (updates.isActive !== undefined) {
        updatePayload.accountEnabled = updates.isActive;
      }

      // 执行更新
      await client.api(`/users/${id}`).patch(updatePayload);

      // 获取更新后的用户
      const updatedUser = await client
        .api(`/users/${id}`)
        .select('id,userPrincipalName,displayName,mail,accountEnabled,createdDateTime,assignedLicenses')
        .expand('memberOf($select=id,displayName,roleTemplateId)')
        .get();

      return E.right(mapGraphUserToUser(updatedUser));
    } catch (error: any) {
      if (error.statusCode === 404) {
        return E.left({
          code: 'USER_NOT_FOUND',
          message: `User with ID ${id} not found`,
        });
      }
      return E.left({
        code: 'GRAPH_API_ERROR',
        message: 'Failed to update user in Microsoft Graph',
        details: error.message || error,
      });
    }
  };

  /**
   * 检查用户是否存在
   */
  const exists = async (id: string): Promise<Either<GraphError, boolean>> => {
    const result = await findById(id);
    if (E.isLeft(result)) {
      if (result.left.code === 'USER_NOT_FOUND') {
        return E.right(false);
      }
      return result as Either<GraphError, boolean>;
    }
    return E.right(true);
  };

  /**
   * 分配许可证给用户
   */
  const assignLicense = async (userId: string, skuId: string): Promise<Either<GraphError, User>> => {
    try {
      console.log(`🔵 [GraphUserService] Assigning license ${skuId} to user ${userId}`);

      // 首先检查用户是否有 usageLocation，如果没有则设置
      const user = await client.api(`/users/${userId}`).select('id,usageLocation').get();

      if (!user.usageLocation) {
        console.log(`🔵 [GraphUserService] User has no usageLocation, setting to HK`);
        await client.api(`/users/${userId}`).patch({
          usageLocation: 'HK',
        });
      }

      await client.api(`/users/${userId}/assignLicense`).post({
        addLicenses: [
          {
            disabledPlans: [],
            skuId: skuId,
          },
        ],
        removeLicenses: [],
      });

      console.log(`✅ [GraphUserService] License assigned successfully`);

      // 获取更新后的用户信息
      const updatedUser = await client
        .api(`/users/${userId}`)
        .select('id,userPrincipalName,displayName,mail,accountEnabled,createdDateTime,assignedLicenses')
        .expand('memberOf($select=id,displayName,roleTemplateId)')
        .get();

      return E.right(mapGraphUserToUser(updatedUser));
    } catch (error: any) {
      console.error('❌ [GraphUserService] Failed to assign license:', error);
      console.error('❌ [GraphUserService] Error details:', JSON.stringify(error, null, 2));

      if (error.statusCode === 404) {
        return E.left({
          code: 'USER_NOT_FOUND',
          message: `User with ID ${userId} not found`,
        });
      }

      // 提取详细的错误信息
      let errorMessage = 'Failed to assign license';
      if (error.body && error.body.error) {
        errorMessage = error.body.error.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return E.left({
        code: 'GRAPH_API_ERROR',
        message: errorMessage,
        details: error.body || error.message || error,
      });
    }
  };

  /**
   * 撤销用户的许可证
   */
  const revokeLicense = async (userId: string, skuId: string): Promise<Either<GraphError, User>> => {
    try {
      console.log(`🔵 [GraphUserService] Revoking license ${skuId} from user ${userId}`);

      await client.api(`/users/${userId}/assignLicense`).post({
        addLicenses: [],
        removeLicenses: [skuId],
      });

      console.log(`✅ [GraphUserService] License revoked successfully`);

      // 获取更新后的用户信息
      const updatedUser = await client
        .api(`/users/${userId}`)
        .select('id,userPrincipalName,displayName,mail,accountEnabled,createdDateTime,assignedLicenses')
        .expand('memberOf($select=id,displayName,roleTemplateId)')
        .get();

      return E.right(mapGraphUserToUser(updatedUser));
    } catch (error: any) {
      console.error('❌ [GraphUserService] Failed to revoke license:', error);
      console.error('❌ [GraphUserService] Error details:', JSON.stringify(error, null, 2));

      if (error.statusCode === 404) {
        return E.left({
          code: 'USER_NOT_FOUND',
          message: `User with ID ${userId} not found`,
        });
      }

      // 提取详细的错误信息
      let errorMessage = 'Failed to revoke license';
      if (error.body && error.body.error) {
        errorMessage = error.body.error.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return E.left({
        code: 'GRAPH_API_ERROR',
        message: errorMessage,
        details: error.body || error.message || error,
      });
    }
  };

  /**
   * 分配目录角色给用户
   */
  const assignDirectoryRole = async (userId: string, roleTemplateId: string): Promise<Either<GraphError, void>> => {
    try {
      // 特殊处理：User 角色是隐式角色，无法被分配
      // roleTemplateId "a0b1b346-4d3e-4e8b-98f8-753987be4970" 是 "User" 角色
      const USER_ROLE_TEMPLATE_ID = 'a0b1b346-4d3e-4e8b-98f8-753987be4970';

      if (roleTemplateId === USER_ROLE_TEMPLATE_ID) {
        console.log(`🔵 [GraphUserService] User role detected - removing all admin roles instead of assigning`);
        return await removeAllDirectoryRoles(userId);
      }

      console.log(`🔵 [GraphUserService] Assigning directory role ${roleTemplateId} to user ${userId}`);

      // 首先，确保角色已激活（获取已激活的角色）
      const rolesResponse = await client
        .api('/directoryRoles')
        .filter(`roleTemplateId eq '${roleTemplateId}'`)
        .get();

      let roleId: string;

      if (rolesResponse.value && rolesResponse.value.length > 0) {
        // 角色已激活
        roleId = rolesResponse.value[0].id;
        console.log(`✅ [GraphUserService] Role already activated, roleId: ${roleId}`);
      } else {
        // 需要激活角色
        console.log(`🔵 [GraphUserService] Activating role with templateId: ${roleTemplateId}`);
        const activateResponse = await client
          .api('/directoryRoles')
          .post({
            roleTemplateId: roleTemplateId,
          });
        roleId = activateResponse.id;
        console.log(`✅ [GraphUserService] Role activated, roleId: ${roleId}`);
      }

      // 将用户添加到角色
      await client
        .api(`/directoryRoles/${roleId}/members/$ref`)
        .post({
          '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`,
        });

      console.log(`✅ [GraphUserService] User added to directory role successfully`);

      return E.right(undefined);
    } catch (error: any) {
      console.error('❌ [GraphUserService] Failed to assign directory role:', error);

      // 如果用户已经在角色中，这不是错误
      if (error.statusCode === 400 && error.message?.includes('already exist')) {
        console.log(`ℹ️ [GraphUserService] User already has this role`);
        return E.right(undefined);
      }

      // 权限不足错误处理
      if (error.statusCode === 403) {
        return E.left({
          code: 'GRAPH_PERMISSION_DENIED',
          message: 'Insufficient privileges to assign role. Please grant "RoleManagement.ReadWrite.Directory" application permission in Azure Portal and grant admin consent.',
          details: error.message || error,
        });
      }

      return E.left({
        code: 'GRAPH_API_ERROR',
        message: 'Failed to assign directory role',
        details: error.message || error,
      });
    }
  };

  /**
   * 移除用户的所有目录角色（将管理员降级为普通用户）
   */
  const removeAllDirectoryRoles = async (userId: string): Promise<Either<GraphError, void>> => {
    try {
      console.log(`🔵 [GraphUserService] Removing all directory roles from user ${userId}`);

      // 获取用户当前的所有目录角色成员资格
      const memberOfResponse = await client
        .api(`/users/${userId}/memberOf/microsoft.graph.directoryRole`)
        .get();

      if (!memberOfResponse.value || memberOfResponse.value.length === 0) {
        console.log(`ℹ️ [GraphUserService] User has no directory roles to remove`);
        return E.right(undefined);
      }

      console.log(`🔵 [GraphUserService] Found ${memberOfResponse.value.length} directory role(s) to remove`);

      // 移除用户的每个目录角色
      for (const role of memberOfResponse.value) {
        try {
          await client
            .api(`/directoryRoles/${role.id}/members/${userId}/$ref`)
            .delete();
          console.log(`✅ [GraphUserService] Removed user from role: ${role.displayName}`);
        } catch (error: any) {
          // 如果角色已经被移除，继续处理其他角色
          if (error.statusCode === 404) {
            console.log(`ℹ️ [GraphUserService] User was not in role ${role.displayName}, skipping`);
            continue;
          }
          throw error;
        }
      }

      console.log(`✅ [GraphUserService] All directory roles removed successfully`);
      return E.right(undefined);
    } catch (error: any) {
      console.error('❌ [GraphUserService] Failed to remove directory roles:', error);

      // 权限不足错误处理
      if (error.statusCode === 403) {
        return E.left({
          code: 'GRAPH_PERMISSION_DENIED',
          message: 'Insufficient privileges to remove roles. Please grant "RoleManagement.ReadWrite.Directory" application permission in Azure Portal and grant admin consent.',
          details: error.message || error,
        });
      }

      return E.left({
        code: 'GRAPH_API_ERROR',
        message: 'Failed to remove directory roles',
        details: error.message || error,
      });
    }
  };

  /**
   * 获取组织的已验证域名
   */
  const getVerifiedDomains = async (): Promise<Either<GraphError, readonly VerifiedDomain[]>> => {
    try {
      console.log('🔵 [GraphUserService] Fetching verified domains from Microsoft Graph API');

      const response = await client
        .api('/organization')
        .select('verifiedDomains')
        .get();

      if (!response.value || response.value.length === 0) {
        return E.left({
          code: 'GRAPH_API_ERROR',
          message: 'No organization data found',
        });
      }

      const verifiedDomains: readonly VerifiedDomain[] = response.value[0].verifiedDomains
        .filter((domain: any) => domain.capabilities?.includes('Email'))
        .map((domain: any) => ({
          name: domain.name,
          isDefault: domain.isDefault || false,
          isInitial: domain.isInitial || false,
        }));

      console.log(`✅ [GraphUserService] Found ${verifiedDomains.length} verified domains`);

      return E.right(verifiedDomains);
    } catch (error: any) {
      console.error('❌ [GraphUserService] Failed to fetch verified domains:', error);
      return E.left({
        code: 'GRAPH_API_ERROR',
        message: 'Failed to fetch verified domains',
        details: error.message || error,
      });
    }
  };

  /**
   * 获取目录角色模板
   */
  const getDirectoryRoles = async (): Promise<Either<GraphError, readonly DirectoryRoleTemplate[]>> => {
    try {
      console.log('🔵 [GraphUserService] Fetching directory role templates from Microsoft Graph API');

      const response = await client
        .api('/directoryRoleTemplates')
        .select('id,displayName,description')
        .get();

      if (!response.value) {
        return E.right([]);
      }

      const roles: readonly DirectoryRoleTemplate[] = response.value.map((role: any) => ({
        id: role.id,
        displayName: role.displayName,
        description: role.description || '',
      }));

      console.log(`✅ [GraphUserService] Fetched ${roles.length} directory roles`);

      return E.right(roles);
    } catch (error: any) {
      console.error('❌ [GraphUserService] Failed to fetch directory roles:', error);
      return E.left({
        code: 'GRAPH_API_ERROR',
        message: 'Failed to fetch directory roles',
        details: error.message || error,
      });
    }
  };

  return {
    findAll,
    findById,
    create,
    update,
    exists,
    assignLicense,
    revokeLicense,
    assignDirectoryRole,
    removeAllDirectoryRoles,
    getVerifiedDomains,
    getDirectoryRoles,
  };
};

/**
 * 生成临时密码（用于新用户）
 */
const generateTemporaryPassword = (): string => {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // 确保包含至少一个大写字母、小写字母、数字和特殊字符
  password += 'A'; // 大写
  password += 'a'; // 小写
  password += '1'; // 数字
  password += '!'; // 特殊字符

  // 填充剩余字符
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // 打乱顺序
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};
