/**
 * Universal Logger Service
 * Provides environment-aware logging with conditional output
 * Maintains same interface as console.* but with environment controls
 */

interface LogContext {
  component?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private debugMode = localStorage.getItem('DEBUG_MODE') === 'true' || import.meta.env.VITE_DEBUG === 'true';
  private logLevel: LogLevel = (localStorage.getItem('LOG_LEVEL') as LogLevel) || 'info';

  private shouldLog(level: LogLevel): boolean {
    if (level === 'error') return true; // Always log errors
    if (level === 'warn' && (this.logLevel === 'warn' || this.logLevel === 'debug' || this.logLevel === 'info')) return true;
    if (level === 'info' && (this.logLevel === 'info' || this.logLevel === 'debug')) return true;
    if (level === 'debug' && (this.debugMode || this.logLevel === 'debug')) return true;
    return false;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
    const prefix = context?.component ? `[${context.component}]` : '';
    const operation = context?.operation ? ` ${context.operation}:` : '';
    return `${timestamp} ${prefix}${operation} ${message}`;
  }

  debug(message: string, context?: LogContext | any): void {
    if (!this.shouldLog('debug')) return;
    
    const logContext = typeof context === 'object' && 'component' in context ? context : undefined;
    const data = logContext ? context.metadata : context;
    
    if (data) {
      console.log(`🔍 ${this.formatMessage('debug', message, logContext)}`, data);
    } else {
      console.log(`🔍 ${this.formatMessage('debug', message, logContext)}`);
    }
  }

  info(message: string, context?: LogContext | any): void {
    if (!this.shouldLog('info')) return;
    
    const logContext = typeof context === 'object' && 'component' in context ? context : undefined;
    const data = logContext ? context.metadata : context;
    
    if (data) {
      console.log(`ℹ️ ${this.formatMessage('info', message, logContext)}`, data);
    } else {
      console.log(`ℹ️ ${this.formatMessage('info', message, logContext)}`);
    }
  }

  warn(message: string, context?: LogContext | any): void {
    if (!this.shouldLog('warn')) return;
    
    const logContext = typeof context === 'object' && 'component' in context ? context : undefined;
    const data = logContext ? context.metadata : context;
    
    if (data) {
      console.warn(`⚠️ ${this.formatMessage('warn', message, logContext)}`, data);
    } else {
      console.warn(`⚠️ ${this.formatMessage('warn', message, logContext)}`);
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    // Always log errors regardless of environment
    const logContext = context || {};
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    if (errorData) {
      console.error(`❌ ${this.formatMessage('error', message, logContext)}`, errorData);
    } else {
      console.error(`❌ ${this.formatMessage('error', message, logContext)}`);
    }
  }

  success(message: string, context?: LogContext | any): void {
    if (!this.shouldLog('info')) return;
    
    const logContext = typeof context === 'object' && 'component' in context ? context : undefined;
    const data = logContext ? context.metadata : context;
    
    if (data) {
      console.log(`✅ ${this.formatMessage('info', message, logContext)}`, data);
    } else {
      console.log(`✅ ${this.formatMessage('info', message, logContext)}`);
    }
  }

  // Legacy console.log replacement
  log(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;
    console.log(`📝 ${message}`, ...args);
  }

  // Performance timing
  time(label: string): void {
    if (this.shouldLog('debug')) {
      console.time(`⏱️ ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog('debug')) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }

  // Environment controls
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    localStorage.setItem('DEBUG_MODE', enabled.toString());
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    localStorage.setItem('LOG_LEVEL', level);
  }

  getConfig(): { isDevelopment: boolean; debugMode: boolean; logLevel: LogLevel } {
    return {
      isDevelopment: this.isDevelopment,
      debugMode: this.debugMode,
      logLevel: this.logLevel
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper for creating component-specific loggers
export const createComponentLogger = (componentName: string) => ({
  debug: (message: string, metadata?: any) => logger.debug(message, { component: componentName, metadata }),
  info: (message: string, metadata?: any) => logger.info(message, { component: componentName, metadata }),
  warn: (message: string, metadata?: any) => logger.warn(message, { component: componentName, metadata }),
  error: (message: string, error?: any) => logger.error(message, error, { component: componentName }),
  success: (message: string, metadata?: any) => logger.success(message, { component: componentName, metadata }),
});