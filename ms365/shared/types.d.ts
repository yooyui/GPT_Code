/**
 * 共享类型定义
 * 前后端共用的数据模型
 */
export type UserRole = 'super_admin' | 'admin' | 'readonly';
export interface User {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: UserRole;
    readonly subscriptionId: string | null;
    readonly isActive: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface CreateUserInput {
    readonly email: string;
    readonly name: string;
    readonly role: UserRole;
}
export interface UpdateUserInput {
    readonly name?: string;
    readonly role?: UserRole;
    readonly isActive?: boolean;
}
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
export type AuditAction = 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'ASSIGN_LICENSE' | 'REVOKE_LICENSE' | 'CREATE_SUBSCRIPTION' | 'UPDATE_SUBSCRIPTION' | 'DELETE_SUBSCRIPTION' | 'IMPORT_DATA' | 'EXPORT_DATA';
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
//# sourceMappingURL=types.d.ts.map