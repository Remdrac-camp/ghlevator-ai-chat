import { LogLevel } from '@/types/monitoring';

interface LogMetadata {
  [key: string]: any;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
  path?: string;
  component?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, metadata: LogMetadata = {}): string {
    const timestamp = new Date().toISOString();
    const baseMetadata = {
      timestamp,
      level,
      environment: process.env.NODE_ENV,
      ...metadata,
    };

    return JSON.stringify({
      message,
      ...baseMetadata,
    });
  }

  public debug(message: string, metadata?: LogMetadata): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, metadata));
    }
  }

  public info(message: string, metadata?: LogMetadata): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(this.formatMessage(LogLevel.INFO, message, metadata));
    }
  }

  public warn(message: string, metadata?: LogMetadata): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage(LogLevel.WARN, message, metadata));
    }
  }

  public error(message: string, error?: Error, metadata?: LogMetadata): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const errorMetadata = {
        ...metadata,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : undefined,
      };
      console.error(this.formatMessage(LogLevel.ERROR, message, errorMetadata));
    }
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const logger = Logger.getInstance(); 