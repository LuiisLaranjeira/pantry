import * as Sentry from '@sentry/react-native';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

interface LoggerOptions {
  /** When true, logs go to console. Defaults to __DEV__. */
  console?: boolean;
}

class Logger {
  private readonly options: Required<LoggerOptions>;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      console: options.console ?? __DEV__,
    };
  }

  debug(message: string, context?: LogContext) {
    this.emit('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.emit('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.emit('warn', message, context);
  }

  /**
   * Reports an exception. The optional `error` is what gets captured by
   * Sentry; `message` is the human-readable label used for the breadcrumb
   * and console output. `context` is attached as `extra` on the Sentry event.
   */
  error(message: string, error?: unknown, context?: LogContext) {
    if (this.options.console) {
      // eslint-disable-next-line no-console -- the logger is the one place we hit console
      console.error(`[error] ${message}`, error ?? '', context ?? '');
    }
    Sentry.addBreadcrumb({
      level: 'error',
      category: 'app',
      message,
      data: context,
    });
    if (error !== undefined) {
      Sentry.captureException(error, { extra: { message, ...context } });
    } else {
      Sentry.captureMessage(message, 'error');
    }
  }

  private emit(level: Exclude<LogLevel, 'error'>, message: string, context?: LogContext) {
    if (this.options.console) {
      // eslint-disable-next-line no-console
      const fn = level === 'warn' ? console.warn : level === 'info' ? console.info : console.debug;
      fn(`[${level}] ${message}`, context ?? '');
    }
    Sentry.addBreadcrumb({
      level: level === 'warn' ? 'warning' : level,
      category: 'app',
      message,
      data: context,
    });
    if (level === 'warn') {
      Sentry.captureMessage(message, 'warning');
    }
  }
}

export const logger = new Logger();
