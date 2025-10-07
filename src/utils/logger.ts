import { LogLevel } from '@app-types';
import { config } from '@config';

class Logger {
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private readonly colors = {
    debug: '\x1b[36m',
    info: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[config.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const color = this.colors[level];
    const reset = this.colors.reset;
    const levelStr = level.toUpperCase().padEnd(5);

    let formatted = `${color}[${timestamp}] ${levelStr}${reset} ${message}`;

    if (meta !== undefined) {
      formatted += ` ${JSON.stringify(meta)}`;
    }

    return formatted;
  }

  public debug(message: string, meta?: unknown): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }

  public info(message: string, meta?: unknown): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, meta));
    }
  }

  public warn(message: string, meta?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  public error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      const meta = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      console.error(this.formatMessage('error', message, meta));
    }
  }
}

export const logger = new Logger();
