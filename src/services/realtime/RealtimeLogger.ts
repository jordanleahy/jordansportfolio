export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'connection' | 'update' | 'cache' | 'performance' | 'error';
  message: string;
  metadata?: Record<string, any>;
}

export interface LoggerMetrics {
  connectionAttempts: number;
  updatesReceived: number;
  updatesProcessed: number;
  cacheInvalidations: number;
  averageProcessingTime: number;
  debounceHits: number;
  errors: number;
}

export class RealtimeLogger {
  private logs: LogEntry[] = [];
  private metrics: LoggerMetrics = {
    connectionAttempts: 0,
    updatesReceived: 0,
    updatesProcessed: 0,
    cacheInvalidations: 0,
    averageProcessingTime: 0,
    debounceHits: 0,
    errors: 0
  };
  private processingTimes: number[] = [];
  private maxLogs: number;

  constructor(maxLogs = 100) {
    this.maxLogs = maxLogs;
  }

  log(level: LogEntry['level'], category: LogEntry['category'], message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      metadata
    };

    this.logs.unshift(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Update metrics based on log entry
    this.updateMetrics(entry);
  }

  private updateMetrics(entry: LogEntry): void {
    switch (entry.category) {
      case 'connection':
        if (entry.message.includes('attempt')) {
          this.metrics.connectionAttempts++;
        }
        break;
      case 'update':
        if (entry.message.includes('received')) {
          this.metrics.updatesReceived++;
        } else if (entry.message.includes('processed')) {
          this.metrics.updatesProcessed++;
          if (entry.metadata?.processingTime) {
            this.processingTimes.push(entry.metadata.processingTime);
            this.updateAverageProcessingTime();
          }
        }
        break;
      case 'cache':
        this.metrics.cacheInvalidations++;
        break;
      case 'performance':
        if (entry.message.includes('debounce')) {
          this.metrics.debounceHits++;
        }
        break;
      case 'error':
        this.metrics.errors++;
        break;
    }
  }

  private updateAverageProcessingTime(): void {
    if (this.processingTimes.length > 0) {
      const sum = this.processingTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageProcessingTime = sum / this.processingTimes.length;
      
      // Keep only recent processing times for rolling average
      if (this.processingTimes.length > 50) {
        this.processingTimes = this.processingTimes.slice(-25);
      }
    }
  }

  getLogs(level?: LogEntry['level']): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  getMetrics(): LoggerMetrics {
    return { ...this.metrics };
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      metrics: this.metrics,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Convenience methods for different log levels
  info(category: LogEntry['category'], message: string, metadata?: Record<string, any>): void {
    this.log('info', category, message, metadata);
  }

  warn(category: LogEntry['category'], message: string, metadata?: Record<string, any>): void {
    this.log('warn', category, message, metadata);
  }

  error(category: LogEntry['category'], message: string, metadata?: Record<string, any>): void {
    this.log('error', category, message, metadata);
  }

  debug(category: LogEntry['category'], message: string, metadata?: Record<string, any>): void {
    this.log('debug', category, message, metadata);
  }
}

// Global logger instance
export const realtimeLogger = new RealtimeLogger();
