/**
 * Advanced Logger for Supabase Edge Functions
 * Provides structured logging with correlation IDs, timing, and error tracking
 */

export interface LogContext {
  correlationId?: string;
  userId?: string;
  functionName?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export interface TimingInfo {
  startTime: number;
  endTime?: number;
  duration?: number;
}

export class AdvancedLogger {
  private context: LogContext;
  private timings: Map<string, TimingInfo> = new Map();

  constructor(context: LogContext = {}) {
    this.context = {
      correlationId: context.correlationId || this.generateCorrelationId(),
      ...context
    };
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatLog(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context: this.context,
      ...(data && { data })
    };
    return JSON.stringify(logEntry, null, 2);
  }

  info(message: string, data?: any): void {
    console.log(`🔵 ${this.formatLog('INFO', message, data)}`);
  }

  warn(message: string, data?: any): void {
    console.warn(`🟡 ${this.formatLog('WARN', message, data)}`);
  }

  error(message: string, error?: any, data?: any): void {
    const errorInfo = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    } : undefined;

    console.error(`🔴 ${this.formatLog('ERROR', message, { error: errorInfo, ...data })}`);
  }

  debug(message: string, data?: any): void {
    console.log(`🔍 ${this.formatLog('DEBUG', message, data)}`);
  }

  success(message: string, data?: any): void {
    console.log(`✅ ${this.formatLog('SUCCESS', message, data)}`);
  }

  startTiming(operation: string): void {
    this.timings.set(operation, { startTime: Date.now() });
    this.debug(`Started timing for operation: ${operation}`);
  }

  endTiming(operation: string): number {
    const timing = this.timings.get(operation);
    if (timing) {
      timing.endTime = Date.now();
      timing.duration = timing.endTime - timing.startTime;
      this.success(`Completed operation: ${operation}`, {
        duration: `${timing.duration}ms`,
        startTime: new Date(timing.startTime).toISOString(),
        endTime: new Date(timing.endTime).toISOString()
      });
      return timing.duration;
    } else {
      this.warn(`No timing found for operation: ${operation}`);
      return 0;
    }
  }

  logApiCall(method: string, url: string, requestData?: any): void {
    this.info(`API Call: ${method} ${url}`, {
      method,
      url,
      requestSize: requestData ? JSON.stringify(requestData).length : 0,
      headers: this.sanitizeHeaders(requestData?.headers)
    });
  }

  logApiResponse(method: string, url: string, status: number, responseData?: any, duration?: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'success';
    
    this[level](`API Response: ${method} ${url} - ${status}`, {
      status,
      duration: duration ? `${duration}ms` : undefined,
      responseSize: responseData ? JSON.stringify(responseData).length : 0,
      success: status < 400
    });
  }

  logDatabaseOperation(operation: string, table: string, result?: any, error?: any): void {
    if (error) {
      this.error(`Database ${operation} failed on ${table}`, error, {
        operation,
        table,
        errorCode: error.code,
        errorMessage: error.message
      });
    } else {
      this.success(`Database ${operation} successful on ${table}`, {
        operation,
        table,
        affectedRows: result?.length || result?.count || 0,
        resultType: Array.isArray(result) ? 'array' : typeof result
      });
    }
  }

  logFunctionStart(functionName: string, input?: any): void {
    this.context.functionName = functionName;
    this.startTiming(`function_${functionName}`);
    this.info(`🚀 Function started: ${functionName}`, {
      inputSize: input ? JSON.stringify(input).length : 0,
      inputKeys: input ? Object.keys(input) : []
    });
  }

  logFunctionEnd(functionName: string, output?: any, error?: any): void {
    const duration = this.endTiming(`function_${functionName}`);
    
    if (error) {
      this.error(`💥 Function failed: ${functionName}`, error, {
        duration: `${duration}ms`,
        outputSize: output ? JSON.stringify(output).length : 0
      });
    } else {
      this.success(`🎉 Function completed: ${functionName}`, {
        duration: `${duration}ms`,
        outputSize: output ? JSON.stringify(output).length : 0,
        outputKeys: output ? Object.keys(output) : []
      });
    }
  }

  logOpenAIRequest(model: string, tokens?: number, cost?: number): void {
    this.info(`🤖 OpenAI Request`, {
      model,
      estimatedTokens: tokens,
      estimatedCost: cost ? `$${cost.toFixed(4)}` : undefined
    });
  }

  logOpenAIResponse(model: string, tokens?: number, cost?: number, error?: any): void {
    if (error) {
      this.error(`🤖 OpenAI Request Failed`, error, {
        model,
        errorType: error.type,
        errorCode: error.code
      });
    } else {
      this.success(`🤖 OpenAI Request Successful`, {
        model,
        actualTokens: tokens,
        actualCost: cost ? `$${cost.toFixed(4)}` : undefined
      });
    }
  }

  logImageGeneration(prompt: string, status: 'started' | 'completed' | 'failed', error?: any, metadata?: any): void {
    const operation = `Image generation ${status}`;
    
    if (status === 'failed') {
      this.error(operation, error, {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 100) + '...',
        ...metadata
      });
    } else {
      this.info(operation, {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 100) + '...',
        ...metadata
      });
    }
  }

  logUserAction(action: string, details?: any): void {
    this.info(`👤 User Action: ${action}`, {
      action,
      userId: this.context.userId,
      ...details
    });
  }

  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined;
    
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'api-key', 'x-api-key', 'bearer'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  // Create child logger with additional context
  child(additionalContext: Partial<LogContext>): AdvancedLogger {
    return new AdvancedLogger({
      ...this.context,
      ...additionalContext
    });
  }

  // Get current context
  getContext(): LogContext {
    return { ...this.context };
  }
}

// Factory function for creating loggers
export function createLogger(context?: LogContext): AdvancedLogger {
  return new AdvancedLogger(context);
}

// Utility function for timing operations
export async function timeOperation<T>(
  logger: AdvancedLogger,
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  logger.startTiming(operationName);
  try {
    const result = await operation();
    logger.endTiming(operationName);
    return result;
  } catch (error) {
    logger.endTiming(operationName);
    logger.error(`Operation failed: ${operationName}`, error);
    throw error;
  }
}