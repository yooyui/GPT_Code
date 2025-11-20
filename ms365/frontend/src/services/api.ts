/**
 * API 服务层
 * 函数式封装 HTTP 请求
 */

import type {
  User,
  Subscription,
  AuditLog,
  DashboardStats,
  CreateUserInput,
  UpdateUserInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  ApiResponse,
} from '../../../shared/types';

const API_BASE_URL = '/api';

// ============= 辅助函数 =============

/**
 * 发送 HTTP 请求（纯函数式封装）
 */
const fetchJson = async <T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
};

/**
 * GET 请求
 */
const get = <T>(url: string): Promise<ApiResponse<T>> =>
  fetchJson<T>(url, { method: 'GET' });

/**
 * POST 请求
 */
const post = <T>(url: string, body: unknown): Promise<ApiResponse<T>> =>
  fetchJson<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });

/**
 * PATCH 请求
 */
const patch = <T>(url: string, body: unknown): Promise<ApiResponse<T>> =>
  fetchJson<T>(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

/**
 * DELETE 请求
 */
const del = <T>(url: string): Promise<ApiResponse<T>> =>
  fetchJson<T>(url, { method: 'DELETE' });

// ============= 用户 API =============

export interface VerifiedDomain {
  readonly name: string;
  readonly isDefault: boolean;
  readonly isInitial: boolean;
}

export const userApi = {
  getAll: () => get<readonly User[]>('/users'),

  getById: (id: string) => get<User>(`/users/${id}`),

  create: (input: CreateUserInput) => post<User>('/users', input),

  update: (id: string, updates: UpdateUserInput) =>
    patch<User>(`/users/${id}`, updates),

  assignSubscription: (userId: string, subscriptionId: string) =>
    post<User>(`/users/${userId}/assign-subscription`, { subscriptionId }),

  revokeSubscription: (userId: string) =>
    post<User>(`/users/${userId}/revoke-subscription`, {}),

  getVerifiedDomains: () => get<readonly VerifiedDomain[]>('/users/domains/verified'),

  getRoles: () => get<readonly DirectoryRole[]>('/users/roles'),
};

export interface DirectoryRole {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

// ============= 订阅 API =============

export const subscriptionApi = {
  getAll: () => get<readonly Subscription[]>('/subscriptions'),

  getById: (id: string) => get<Subscription>(`/subscriptions/${id}`),

  create: (input: CreateSubscriptionInput) =>
    post<Subscription>('/subscriptions', input),

  update: (id: string, updates: UpdateSubscriptionInput) =>
    patch<Subscription>(`/subscriptions/${id}`, updates),
};

// ============= 审计日志 API =============

export const auditLogApi = {
  getAll: (limit = 100) => get<readonly AuditLog[]>(`/audit-logs?limit=${limit}`),

  getByUserId: (userId: string, limit = 100) =>
    get<readonly AuditLog[]>(`/audit-logs/user/${userId}?limit=${limit}`),
};

// ============= 仪表板 API =============

export const dashboardApi = {
  getStats: () => get<DashboardStats>('/dashboard/stats'),
};
