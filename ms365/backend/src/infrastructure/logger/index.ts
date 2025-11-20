/**
 * 简单日志系统
 * 提供结构化日志记录
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly context?: Record<string, unknown>;
}

/**
 * 格式化日志条目
 */
const formatLogEntry = (entry: LogEntry): string => {
  const { level, message, timestamp, context } = entry;
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
};

/**
 * 创建日志条目
 */
const createLogEntry = (
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  context,
});

/**
 * 日志记录器（副作用函数，IO边界）
 */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('debug', message, context);
    console.debug(formatLogEntry(entry));
  },

  info: (message: string, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('info', message, context);
    console.info(formatLogEntry(entry));
  },

  warn: (message: string, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('warn', message, context);
    console.warn(formatLogEntry(entry));
  },

  error: (message: string, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('error', message, context);
    console.error(formatLogEntry(entry));
  },
};
