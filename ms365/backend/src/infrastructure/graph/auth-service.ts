/**
 * Microsoft Graph 认证服务
 * 使用客户端凭据流（Client Credentials Flow）
 */

import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import type { AppConfig } from '../../config/index.js';
import { E } from '../../utils/fp.js';
import type { Either } from 'fp-ts/Either';

export interface GraphAuthError {
  readonly code: 'AUTH_CONFIG_MISSING' | 'AUTH_FAILED';
  readonly message: string;
  readonly details?: unknown;
}

/**
 * 验证 Azure 配置是否完整
 */
const validateAzureConfig = (config: AppConfig['azure']): Either<GraphAuthError, void> => {
  if (!config.tenantId || !config.clientId || !config.clientSecret) {
    return E.left({
      code: 'AUTH_CONFIG_MISSING',
      message: 'Azure AD configuration is incomplete. Please check AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in .env file.',
    });
  }
  return E.right(undefined);
};

/**
 * 创建 Graph 客户端（纯函数式封装）
 */
export const createGraphClient = (config: AppConfig['azure']): Either<GraphAuthError, Client> => {
  try {
    // 验证配置
    const validationResult = validateAzureConfig(config);
    if (E.isLeft(validationResult)) {
      return validationResult;
    }

    // 创建凭据
    const credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret
    );

    // 创建认证提供者
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: [config.scope],
    });

    // 创建 Graph 客户端
    const client = Client.initWithMiddleware({
      authProvider,
      defaultVersion: 'v1.0',
    });

    return E.right(client);
  } catch (error) {
    return E.left({
      code: 'AUTH_FAILED',
      message: 'Failed to create Graph client',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Graph 认证服务
 */
export interface GraphAuthService {
  readonly getClient: () => Either<GraphAuthError, Client>;
  readonly isConfigured: () => boolean;
}

/**
 * 创建 Graph 认证服务
 */
export const createGraphAuthService = (config: AppConfig['azure']): GraphAuthService => {
  // 懒加载客户端
  let clientCache: Either<GraphAuthError, Client> | null = null;

  const getClient = (): Either<GraphAuthError, Client> => {
    if (clientCache === null) {
      clientCache = createGraphClient(config);
    }
    return clientCache;
  };

  const isConfigured = (): boolean => {
    return Boolean(config.tenantId && config.clientId && config.clientSecret);
  };

  return {
    getClient,
    isConfigured,
  };
};
