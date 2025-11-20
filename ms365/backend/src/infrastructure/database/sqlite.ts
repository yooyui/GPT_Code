/**
 * SQLite 数据库层
 * 使用函数式方法封装数据库操作
 */

import Database from 'better-sqlite3';
import { getConfig } from '../../config/index.js';
import { tryCatch, success } from '../../utils/fp.js';
import type { Result } from '../../utils/fp.js';
import type { User, Subscription, AuditLog } from '../../../../shared/types.js';

// ============= 数据库初始化 =============

/**
 * 初始化数据库（副作用函数，IO边界）
 */
export const initDatabase = (): Result<Error, Database.Database> =>
  tryCatch(() => {
    const config = getConfig();
    const db = new Database(config.database.path);

    // 启用外键约束
    db.pragma('foreign_keys = ON');

    // 创建表
    createTables(db);

    return db;
  });

/**
 * 创建数据表（副作用函数）
 */
const createTables = (db: Database.Database): void => {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin', 'admin', 'readonly')),
      azure_role_template_id TEXT,
      subscription_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    )
  `);

  // Migration: Add azure_role_template_id column if it doesn't exist
  try {
    db.exec(`ALTER TABLE users ADD COLUMN azure_role_template_id TEXT`);
  } catch (error: any) {
    // Column already exists, ignore error
    if (!error.message?.includes('duplicate column name')) {
      throw error;
    }
  }

  // 订阅表
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      total_licenses INTEGER NOT NULL CHECK(total_licenses > 0),
      used_licenses INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('active', 'expired')),
      expiry_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // 审计日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `);
};

// ============= 用户仓储 =============

export interface UserRepository {
  readonly findAll: () => Result<Error, readonly User[]>;
  readonly findById: (id: string) => Result<Error, User | null>;
  readonly findByEmail: (email: string) => Result<Error, User | null>;
  readonly create: (user: User) => Result<Error, User>;
  readonly update: (user: User) => Result<Error, User>;
  readonly delete: (id: string) => Result<Error, void>;
  readonly count: () => Result<Error, number>;
}

export const createUserRepository = (db: Database.Database): UserRepository => ({
  findAll: () =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
      return stmt.all().map(rowToUser);
    }),

  findById: (id: string) =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
      const row = stmt.get(id);
      return row ? rowToUser(row) : null;
    }),

  findByEmail: (email: string) =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const row = stmt.get(email);
      return row ? rowToUser(row) : null;
    }),

  create: (user: User) =>
    tryCatch(() => {
      const stmt = db.prepare(`
        INSERT INTO users (id, email, name, role, azure_role_template_id, subscription_id, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        user.id,
        user.email,
        user.name,
        user.role,
        user.azureRoleTemplateId || null,
        user.subscriptionId,
        user.isActive ? 1 : 0,
        user.createdAt,
        user.updatedAt
      );
      return user;
    }),

  update: (user: User) =>
    tryCatch(() => {
      const stmt = db.prepare(`
        UPDATE users
        SET email = ?, name = ?, role = ?, azure_role_template_id = ?, subscription_id = ?, is_active = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        user.email,
        user.name,
        user.role,
        user.azureRoleTemplateId || null,
        user.subscriptionId,
        user.isActive ? 1 : 0,
        user.updatedAt,
        user.id
      );
      return user;
    }),

  delete: (id: string) =>
    tryCatch(() => {
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(id);
    }),

  count: () =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
      const result = stmt.get() as { count: number };
      return result.count;
    }),
});

// ============= 订阅仓储 =============

export interface SubscriptionRepository {
  readonly findAll: () => Result<Error, readonly Subscription[]>;
  readonly findById: (id: string) => Result<Error, Subscription | null>;
  readonly create: (subscription: Subscription) => Result<Error, Subscription>;
  readonly update: (subscription: Subscription) => Result<Error, Subscription>;
  readonly delete: (id: string) => Result<Error, void>;
  readonly count: () => Result<Error, number>;
}

export const createSubscriptionRepository = (db: Database.Database): SubscriptionRepository => ({
  findAll: () =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT * FROM subscriptions ORDER BY created_at DESC');
      return stmt.all().map(rowToSubscription);
    }),

  findById: (id: string) =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT * FROM subscriptions WHERE id = ?');
      const row = stmt.get(id);
      return row ? rowToSubscription(row) : null;
    }),

  create: (subscription: Subscription) =>
    tryCatch(() => {
      const stmt = db.prepare(`
        INSERT INTO subscriptions (id, name, total_licenses, used_licenses, status, expiry_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        subscription.id,
        subscription.name,
        subscription.totalLicenses,
        subscription.usedLicenses,
        subscription.status,
        subscription.expiryDate,
        subscription.createdAt,
        subscription.updatedAt
      );
      return subscription;
    }),

  update: (subscription: Subscription) =>
    tryCatch(() => {
      const stmt = db.prepare(`
        UPDATE subscriptions
        SET name = ?, total_licenses = ?, used_licenses = ?, status = ?, expiry_date = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        subscription.name,
        subscription.totalLicenses,
        subscription.usedLicenses,
        subscription.status,
        subscription.expiryDate,
        subscription.updatedAt,
        subscription.id
      );
      return subscription;
    }),

  delete: (id: string) =>
    tryCatch(() => {
      const stmt = db.prepare('DELETE FROM subscriptions WHERE id = ?');
      stmt.run(id);
    }),

  count: () =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM subscriptions');
      const result = stmt.get() as { count: number };
      return result.count;
    }),
});

// ============= 审计日志仓储 =============

export interface AuditLogRepository {
  readonly findAll: (limit?: number) => Result<Error, readonly AuditLog[]>;
  readonly findById: (id: string) => Result<Error, AuditLog | null>;
  readonly findByUserId: (userId: string, limit?: number) => Result<Error, readonly AuditLog[]>;
  readonly create: (log: AuditLog) => Result<Error, AuditLog>;
  readonly count: () => Result<Error, number>;
}

export const createAuditLogRepository = (db: Database.Database): AuditLogRepository => ({
  findAll: (limit = 100) =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?');
      return stmt.all(limit).map(rowToAuditLog);
    }),

  findById: (id: string) =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT * FROM audit_logs WHERE id = ?');
      const row = stmt.get(id);
      return row ? rowToAuditLog(row) : null;
    }),

  findByUserId: (userId: string, limit = 100) =>
    tryCatch(() => {
      const stmt = db.prepare(
        'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?'
      );
      return stmt.all(userId, limit).map(rowToAuditLog);
    }),

  create: (log: AuditLog) =>
    tryCatch(() => {
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        log.id,
        log.userId,
        log.action,
        log.targetType,
        log.targetId,
        log.details,
        log.timestamp
      );
      return log;
    }),

  count: () =>
    tryCatch(() => {
      const stmt = db.prepare('SELECT COUNT(*) as count FROM audit_logs');
      const result = stmt.get() as { count: number };
      return result.count;
    }),
});

// ============= 行映射函数 =============

const rowToUser = (row: any): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  azureRoleTemplateId: row.azure_role_template_id || null,
  subscriptionId: row.subscription_id,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToSubscription = (row: any): Subscription => ({
  id: row.id,
  name: row.name,
  totalLicenses: row.total_licenses,
  usedLicenses: row.used_licenses,
  status: row.status,
  expiryDate: row.expiry_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const rowToAuditLog = (row: any): AuditLog => ({
  id: row.id,
  userId: row.user_id,
  action: row.action,
  targetType: row.target_type,
  targetId: row.target_id,
  details: row.details,
  timestamp: row.timestamp,
});
