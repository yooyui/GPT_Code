/**
 * Markdown 备份功能
 * 将数据库数据定期备份为 Markdown 格式
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { format } from 'date-fns';
import { tryCatch } from '../../utils/fp.js';
import type { Result } from '../../utils/fp.js';
import type { User, Subscription, AuditLog } from '../../../../shared/types.js';

// ============= Markdown 生成函数 =============

/**
 * 生成用户列表的 Markdown
 */
export const generateUsersMarkdown = (users: readonly User[]): string => {
  const header = `# 用户列表

> 生成时间: ${new Date().toISOString()}
> 总数: ${users.length}

| ID | 邮箱 | 姓名 | 角色 | 订阅ID | 状态 | 创建时间 |
|---|---|---|---|---|---|---|
`;

  const rows = users
    .map(
      (u) =>
        `| ${u.id} | ${u.email} | ${u.name} | ${u.role} | ${u.subscriptionId || '-'} | ${u.isActive ? '激活' : '停用'} | ${u.createdAt} |`
    )
    .join('\n');

  return header + rows + '\n';
};

/**
 * 生成订阅列表的 Markdown
 */
export const generateSubscriptionsMarkdown = (subscriptions: readonly Subscription[]): string => {
  const header = `# 订阅列表

> 生成时间: ${new Date().toISOString()}
> 总数: ${subscriptions.length}

| ID | 名称 | 总许可数 | 已用许可数 | 可用许可数 | 状态 | 过期日期 | 创建时间 |
|---|---|---|---|---|---|---|---|
`;

  const rows = subscriptions
    .map((s) => {
      const available = s.totalLicenses - s.usedLicenses;
      return `| ${s.id} | ${s.name} | ${s.totalLicenses} | ${s.usedLicenses} | ${available} | ${s.status} | ${s.expiryDate} | ${s.createdAt} |`;
    })
    .join('\n');

  return header + rows + '\n';
};

/**
 * 生成审计日志的 Markdown
 */
export const generateAuditLogsMarkdown = (logs: readonly AuditLog[]): string => {
  const header = `# 审计日志

> 生成时间: ${new Date().toISOString()}
> 总数: ${logs.length}

| ID | 用户ID | 动作 | 目标类型 | 目标ID | 时间戳 |
|---|---|---|---|---|---|
`;

  const rows = logs
    .map((l) => `| ${l.id} | ${l.userId} | ${l.action} | ${l.targetType} | ${l.targetId} | ${l.timestamp} |`)
    .join('\n');

  return header + rows + '\n';
};

/**
 * 生成完整的备份 Markdown（包含所有数据）
 */
export const generateFullBackupMarkdown = (
  users: readonly User[],
  subscriptions: readonly Subscription[],
  logs: readonly AuditLog[]
): string => {
  const timestamp = new Date().toISOString();

  return `# MS365 管理系统 - 完整数据备份

> 备份时间: ${timestamp}
> 数据统计:
> - 用户数: ${users.length}
> - 订阅数: ${subscriptions.length}
> - 日志数: ${logs.length}

---

${generateUsersMarkdown(users)}

---

${generateSubscriptionsMarkdown(subscriptions)}

---

${generateAuditLogsMarkdown(logs)}

---

*此文件由系统自动生成*
`;
};

/**
 * 生成仪表板统计的 Markdown
 */
export const generateDashboardMarkdown = (
  users: readonly User[],
  subscriptions: readonly Subscription[]
): string => {
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;

  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
  const totalLicenses = subscriptions.reduce((sum, s) => sum + s.totalLicenses, 0);
  const usedLicenses = subscriptions.reduce((sum, s) => sum + s.usedLicenses, 0);
  const availableLicenses = totalLicenses - usedLicenses;
  const utilizationRate =
    totalLicenses > 0 ? ((usedLicenses / totalLicenses) * 100).toFixed(2) : '0.00';

  return `# 系统仪表板统计

> 生成时间: ${new Date().toISOString()}

## 用户统计

- **总用户数**: ${totalUsers}
- **激活用户数**: ${activeUsers}
- **管理员用户数**: ${adminUsers}

## 订阅统计

- **总订阅数**: ${totalSubscriptions}
- **激活订阅数**: ${activeSubscriptions}

## 许可证统计

- **总许可数**: ${totalLicenses}
- **已用许可数**: ${usedLicenses}
- **可用许可数**: ${availableLicenses}
- **使用率**: ${utilizationRate}%

## 许可证使用率可视化

\`\`\`
已使用: ${'█'.repeat(Math.floor(Number(utilizationRate) / 5))}${' '.repeat(
  20 - Math.floor(Number(utilizationRate) / 5)
)} ${utilizationRate}%
\`\`\`

---

*此文件由系统自动生成*
`;
};

// ============= 文件保存函数 =============

/**
 * 确保备份目录存在
 */
const ensureBackupDir = async (backupPath: string): Promise<Result<Error, void>> =>
  tryCatch(async () => {
    await mkdir(backupPath, { recursive: true });
  });

/**
 * 保存 Markdown 文件
 */
export const saveMarkdownFile = async (
  filePath: string,
  content: string
): Promise<Result<Error, void>> =>
  tryCatch(async () => {
    await writeFile(filePath, content, 'utf-8');
  });

/**
 * 执行完整备份
 */
export const performFullBackup = async (
  backupPath: string,
  users: readonly User[],
  subscriptions: readonly Subscription[],
  logs: readonly AuditLog[]
): Promise<Result<Error, void>> =>
  tryCatch(async () => {
    // 确保目录存在
    const dirResult = await ensureBackupDir(backupPath);
    if (dirResult._tag === 'Left') throw dirResult.left;

    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

    // 保存完整备份
    const fullBackupContent = generateFullBackupMarkdown(users, subscriptions, logs);
    const fullBackupPath = join(backupPath, `backup_${timestamp}.md`);
    const fullResult = await saveMarkdownFile(fullBackupPath, fullBackupContent);
    if (fullResult._tag === 'Left') throw fullResult.left;

    // 保存仪表板统计
    const dashboardContent = generateDashboardMarkdown(users, subscriptions);
    const dashboardPath = join(backupPath, `dashboard_${timestamp}.md`);
    const dashboardResult = await saveMarkdownFile(dashboardPath, dashboardContent);
    if (dashboardResult._tag === 'Left') throw dashboardResult.left;

    // 保存分类文件
    const usersPath = join(backupPath, `users_${timestamp}.md`);
    const usersResult = await saveMarkdownFile(usersPath, generateUsersMarkdown(users));
    if (usersResult._tag === 'Left') throw usersResult.left;

    const subscriptionsPath = join(backupPath, `subscriptions_${timestamp}.md`);
    const subsResult = await saveMarkdownFile(
      subscriptionsPath,
      generateSubscriptionsMarkdown(subscriptions)
    );
    if (subsResult._tag === 'Left') throw subsResult.left;
  });

/**
 * 保存当前快照（覆盖latest文件）
 */
export const saveLatestSnapshot = async (
  backupPath: string,
  users: readonly User[],
  subscriptions: readonly Subscription[]
): Promise<Result<Error, void>> =>
  tryCatch(async () => {
    // 确保目录存在
    const dirResult = await ensureBackupDir(backupPath);
    if (dirResult._tag === 'Left') throw dirResult.left;

    // 保存最新仪表板
    const dashboardContent = generateDashboardMarkdown(users, subscriptions);
    const dashboardPath = join(backupPath, 'dashboard_latest.md');
    const dashboardResult = await saveMarkdownFile(dashboardPath, dashboardContent);
    if (dashboardResult._tag === 'Left') throw dashboardResult.left;

    // 保存最新用户列表
    const usersPath = join(backupPath, 'users_latest.md');
    const usersResult = await saveMarkdownFile(usersPath, generateUsersMarkdown(users));
    if (usersResult._tag === 'Left') throw usersResult.left;

    // 保存最新订阅列表
    const subscriptionsPath = join(backupPath, 'subscriptions_latest.md');
    const subsResult = await saveMarkdownFile(
      subscriptionsPath,
      generateSubscriptionsMarkdown(subscriptions)
    );
    if (subsResult._tag === 'Left') throw subsResult.left;
  });
