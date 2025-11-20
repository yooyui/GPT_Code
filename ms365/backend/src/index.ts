/**
 * MS365 管理系统后端入口
 * 函数式编程架构
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getConfig } from './config/index.js';
import { logger } from './infrastructure/logger/index.js';
import { errorHandler } from './api/middleware/error-handler.js';

// 数据库
import {
  initDatabase,
  createUserRepository,
  createSubscriptionRepository,
  createAuditLogRepository,
} from './infrastructure/database/sqlite.js';

// 服务
import { createUserService } from './application/user-service.js';
import { createSubscriptionService } from './application/subscription-service.js';
import { createAuditService } from './application/audit-service.js';
import { createDashboardService } from './application/dashboard-service.js';
import { createHybridUserService } from './application/hybrid-user-service.js';
import { createHybridSubscriptionService } from './application/hybrid-subscription-service.js';

// Graph 服务
import {
  createGraphAuthService,
  createGraphUserService,
  createGraphSubscriptionService
} from './infrastructure/graph/index.js';

// 路由
import { createUserRoutes } from './api/routes/users.js';
import { createSubscriptionRoutes } from './api/routes/subscriptions.js';
import { createAuditLogRoutes } from './api/routes/audit-logs.js';
import { createDashboardRoutes } from './api/routes/dashboard.js';

// Markdown 备份
import { saveLatestSnapshot, performFullBackup } from './infrastructure/database/markdown.js';
import { E } from './utils/fp.js';

/**
 * 初始化应用
 */
const initializeApp = (): void => {
  const config = getConfig();

  // 初始化数据库
  const dbResult = initDatabase();
  if (E.isLeft(dbResult)) {
    logger.error('Failed to initialize database', { error: dbResult.left.message });
    process.exit(1);
  }
  const db = dbResult.right;
  logger.info('Database initialized successfully');

  // 创建仓储
  const userRepo = createUserRepository(db);
  const subscriptionRepo = createSubscriptionRepository(db);
  const auditLogRepo = createAuditLogRepository(db);

  // 创建本地服务
  // 注意：这里我们暂时传递 null 作为 graphUserService，因为此时还没有初始化 Graph 客户端
  // 在生产模式下，如果 Graph 初始化成功，我们会重新创建 userService
  const localUserService = createUserService(userRepo, null as any);
  const localSubscriptionService = createSubscriptionService(subscriptionRepo, userRepo);
  const auditService = createAuditService(auditLogRepo);

  // 创建 Graph 服务（如果配置了）
  const graphAuthService = createGraphAuthService(config.azure);
  let graphUserService = null;
  let graphSubscriptionService = null;

  if (config.mode === 'production') {
    logger.info('🔐 Production mode enabled, initializing Microsoft Graph integration...');

    if (graphAuthService.isConfigured()) {
      const clientResult = graphAuthService.getClient();

      if (E.isRight(clientResult)) {
        const client = clientResult.right;
        graphUserService = createGraphUserService(client);
        graphSubscriptionService = createGraphSubscriptionService(client);
        logger.info('✅ Microsoft Graph client initialized successfully');
      } else {
        logger.error('❌ Failed to initialize Graph client:', {
          error: clientResult.left.message,
        });
        logger.warn('⚠️  Falling back to local database mode');
      }
    } else {
      logger.warn('⚠️  Azure AD configuration is incomplete');
      logger.warn('⚠️  Please configure AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET');
      logger.warn('⚠️  Falling back to local database mode');
    }
  } else {
    logger.info('🔧 Development mode: using local SQLite database');
  }

  // 创建混合服务（注意：先创建订阅服务，因为用户服务依赖它来填充订阅名称）
  const subscriptionService = createHybridSubscriptionService(
    config.mode,
    localSubscriptionService,
    graphSubscriptionService
  );

  const userService = createHybridUserService(
    config.mode,
    // 如果启用了 Graph，使用注入了 Graph 服务的 userService
    graphUserService ? createUserService(userRepo, graphUserService) : localUserService,
    graphUserService,
    subscriptionService
  );

  // 创建仪表板服务（使用混合服务）
  const dashboardService = createDashboardService(userService, subscriptionService);

  // 创建 Express 应用
  const app = express();

  // 中间件
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 请求日志
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
    });
    next();
  });

  // 路由
  app.use('/api/users', createUserRoutes(userService, auditService));
  app.use('/api/subscriptions', createSubscriptionRoutes(subscriptionService, auditService));
  app.use('/api/audit-logs', createAuditLogRoutes(auditService));
  app.use('/api/dashboard', createDashboardRoutes(dashboardService));

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 错误处理
  app.use(errorHandler);

  // 启动服务器
  app.listen(config.server.port, config.server.host, () => {
    logger.info(`Server running at http://${config.server.host}:${config.server.port}`);
    logger.info('API endpoints available at:');
    logger.info('  - GET  /api/users');
    logger.info('  - POST /api/users');
    logger.info('  - GET  /api/subscriptions');
    logger.info('  - POST /api/subscriptions');
    logger.info('  - GET  /api/audit-logs');
    logger.info('  - GET  /api/dashboard/stats');
  });

  // 定期备份（如果启用）
  if (config.backup.enabled) {
    logger.info(`Backup enabled, interval: ${config.backup.interval}ms`);

    // 立即执行一次备份
    performInitialBackup(userRepo, subscriptionRepo, config.backup.path);

    // 定期备份
    setInterval(async () => {
      await performScheduledBackup(userRepo, subscriptionRepo, auditLogRepo, config.backup.path);
    }, config.backup.interval);
  }

  // 优雅关闭
  process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    db.close();
    process.exit(0);
  });
};

/**
 * 执行初始备份
 */
const performInitialBackup = async (
  userRepo: ReturnType<typeof createUserRepository>,
  subscriptionRepo: ReturnType<typeof createSubscriptionRepository>,
  backupPath: string
): Promise<void> => {
  logger.info('Performing initial backup...');

  const usersResult = userRepo.findAll();
  const subscriptionsResult = subscriptionRepo.findAll();

  if (E.isRight(usersResult) && E.isRight(subscriptionsResult)) {
    const result = await saveLatestSnapshot(
      backupPath,
      usersResult.right,
      subscriptionsResult.right
    );

    if (E.isRight(result)) {
      logger.info('Initial backup completed successfully');
    } else {
      logger.error('Initial backup failed', { error: result.left.message });
    }
  }
};

/**
 * 执行定期备份
 */
const performScheduledBackup = async (
  userRepo: ReturnType<typeof createUserRepository>,
  subscriptionRepo: ReturnType<typeof createSubscriptionRepository>,
  auditLogRepo: ReturnType<typeof createAuditLogRepository>,
  backupPath: string
): Promise<void> => {
  logger.info('Performing scheduled backup...');

  const usersResult = userRepo.findAll();
  const subscriptionsResult = subscriptionRepo.findAll();
  const logsResult = auditLogRepo.findAll(1000);

  if (E.isRight(usersResult) && E.isRight(subscriptionsResult) && E.isRight(logsResult)) {
    // 保存完整备份
    const fullBackupResult = await performFullBackup(
      backupPath,
      usersResult.right,
      subscriptionsResult.right,
      logsResult.right
    );

    // 保存最新快照
    const snapshotResult = await saveLatestSnapshot(
      backupPath,
      usersResult.right,
      subscriptionsResult.right
    );

    if (E.isRight(fullBackupResult) && E.isRight(snapshotResult)) {
      logger.info('Scheduled backup completed successfully');
    } else {
      logger.error('Scheduled backup failed');
    }
  }
};

// 启动应用
initializeApp();
