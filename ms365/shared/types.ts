/**
 * 共享类型定义
 * 前后端共用的数据模型
 */

// ============= 用户相关 =============

export type UserRole = 'super_admin' | 'admin' | 'readonly';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly azureRoleTemplateId?: string | null; // Azure AD 目录角色模板 ID
  readonly subscriptionId: string | null;
  readonly subscriptionName?: string | null; // 订阅名称，用于显示
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateUserInput {
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly usageLocation?: string; // 使用位置/地区代码（ISO 3166-1 alpha-2）
  readonly directoryRoleTemplateId?: string; // 可选的 Azure AD 目录角色模板 ID
}

export interface UpdateUserInput {
  readonly name?: string;
  readonly role?: UserRole;
  readonly isActive?: boolean;
  readonly directoryRoleTemplateId?: string;
}

// ============= 订阅相关 =============

export type SubscriptionStatus = 'active' | 'expired';

export interface Subscription {
  readonly id: string;
  readonly name: string;
  readonly totalLicenses: number;
  readonly usedLicenses: number;
  readonly status: SubscriptionStatus;
  readonly expiryDate: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateSubscriptionInput {
  readonly name: string;
  readonly totalLicenses: number;
  readonly expiryDate: string;
}

export interface UpdateSubscriptionInput {
  readonly name?: string;
  readonly totalLicenses?: number;
  readonly status?: SubscriptionStatus;
  readonly expiryDate?: string;
}

// ============= 审计日志相关 =============

export type AuditAction =
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'ASSIGN_LICENSE'
  | 'REVOKE_LICENSE'
  | 'CREATE_SUBSCRIPTION'
  | 'UPDATE_SUBSCRIPTION'
  | 'DELETE_SUBSCRIPTION'
  | 'IMPORT_DATA'
  | 'EXPORT_DATA';

export interface AuditLog {
  readonly id: string;
  readonly userId: string;
  readonly action: AuditAction;
  readonly targetType: string;
  readonly targetId: string;
  readonly details: string;
  readonly timestamp: string;
}

export interface CreateAuditLogInput {
  readonly userId: string;
  readonly action: AuditAction;
  readonly targetType: string;
  readonly targetId: string;
  readonly details: Record<string, unknown>;
}

// ============= API 响应相关 =============

export interface ApiSuccess<T> {
  readonly success: true;
  readonly data: T;
}

export interface ApiError {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============= 分页相关 =============

export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

// ============= 仪表板统计 =============

export interface DashboardStats {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly totalSubscriptions: number;
  readonly activeSubscriptions: number;
  readonly totalLicenses: number;
  readonly usedLicenses: number;
  readonly availableLicenses: number;
  readonly licenseUtilization: number;
}

// ============= 导入导出相关 =============

export interface ExportOptions {
  readonly format: 'csv' | 'json';
  readonly entityType: 'users' | 'subscriptions' | 'audit_logs';
}

export interface ImportResult {
  readonly success: boolean;
  readonly imported: number;
  readonly failed: number;
  readonly errors: readonly string[];
}
