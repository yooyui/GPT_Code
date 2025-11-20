/**
 * 应用配置
 * 遵循函数式编程原则，所有配置均为不可变
 */

export type AppMode = 'development' | 'production';

export interface AppConfig {
  readonly server: {
    readonly port: number;
    readonly host: string;
  };
  readonly database: {
    readonly path: string;
  };
  readonly backup: {
    readonly enabled: boolean;
    readonly path: string;
    readonly interval: number; // 备份间隔（毫秒）
  };
  readonly cors: {
    readonly enabled: boolean;
    readonly origin: readonly string[];
  };
  readonly azure: {
    readonly tenantId: string;
    readonly clientId: string;
    readonly clientSecret: string;
    readonly graphApiEndpoint: string;
    readonly scope: string;
  };
  readonly mode: AppMode;
}

/**
 * 默认配置（纯值对象）
 */
export const defaultConfig: AppConfig = {
  server: {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || 'localhost',
  },
  database: {
    path: process.env.DB_PATH || './data/db.sqlite',
  },
  backup: {
    enabled: process.env.BACKUP_ENABLED !== 'false',
    path: process.env.BACKUP_PATH || './data/backups',
    interval: Number(process.env.BACKUP_INTERVAL) || 3600000, // 默认 1 小时
  },
  cors: {
    enabled: true,
    origin: ['http://localhost:5173'],
  },
  azure: {
    tenantId: process.env.AZURE_TENANT_ID || '',
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    graphApiEndpoint: process.env.GRAPH_API_ENDPOINT || 'https://graph.microsoft.com/v1.0',
    scope: process.env.GRAPH_API_SCOPE || 'https://graph.microsoft.com/.default',
  },
  mode: (process.env.APP_MODE as AppMode) || 'development',
} as const;

/**
 * 获取配置（纯函数）
 */
export const getConfig = (): AppConfig => defaultConfig;
