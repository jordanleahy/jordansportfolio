# Agent Performance Monitoring

## Overview

Comprehensive monitoring system for tracking agent performance, resource utilization, and quality metrics across the entire AI agent ecosystem.

## Key Performance Indicators

### Response Time Metrics
```typescript
interface ResponseTimeMetrics {
  averageResponseTime: number;    // Mean response time in ms
  p50ResponseTime: number;        // 50th percentile
  p95ResponseTime: number;        // 95th percentile  
  p99ResponseTime: number;        // 99th percentile
  maxResponseTime: number;        // Maximum observed
  responseTimeDistribution: {
    [timeRange: string]: number;  // Distribution buckets
  };
}
```

### Success Rate Tracking
```typescript
interface SuccessRateMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;            // Percentage
  errorCategories: {
    [errorType: string]: number;  // Error breakdown
  };
  timeToRecovery: number;         // Average recovery time
}
```

### Resource Utilization
```typescript
interface ResourceMetrics {
  tokenUsage: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    costEstimate: number;
  };
  apiCalls: {
    openaiCalls: number;
    databaseQueries: number;
    cacheHits: number;
    cacheMisses: number;
  };
  concurrentExecutions: number;
  queueDepth: number;
}
```

## Monitoring Infrastructure

### Database Schema
```sql
-- Agent performance tracking
CREATE TABLE agent_performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES openai_agents,
  user_id uuid NOT NULL REFERENCES auth.users,
  execution_start timestamptz NOT NULL,
  execution_end timestamptz,
  response_time_ms integer,
  success boolean,
  error_type text,
  error_message text,
  token_usage jsonb,
  request_metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Aggregated performance metrics  
CREATE TABLE agent_performance_aggregates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES openai_agents,
  date date NOT NULL,
  total_executions integer DEFAULT 0,
  successful_executions integer DEFAULT 0,
  failed_executions integer DEFAULT 0,
  avg_response_time_ms numeric,
  p95_response_time_ms numeric,
  total_tokens_used bigint DEFAULT 0,
  total_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, date)
);

-- Real-time monitoring alerts
CREATE TABLE performance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES openai_agents,
  alert_type text NOT NULL,
  threshold_value numeric,
  actual_value numeric,
  severity alert_severity DEFAULT 'medium',
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
```

### Performance Collection
```typescript
class PerformanceCollector {
  async logExecution(
    agentId: string,
    executionContext: ExecutionContext
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await executeAgent(agentId, executionContext);
      const endTime = Date.now();
      
      await this.recordSuccess({
        agent_id: agentId,
        execution_start: new Date(startTime),
        execution_end: new Date(endTime),
        response_time_ms: endTime - startTime,
        success: true,
        token_usage: result.tokenUsage,
        request_metadata: executionContext
      });
      
    } catch (error) {
      const endTime = Date.now();
      
      await this.recordFailure({
        agent_id: agentId,
        execution_start: new Date(startTime),
        execution_end: new Date(endTime),
        response_time_ms: endTime - startTime,
        success: false,
        error_type: error.name,
        error_message: error.message,
        request_metadata: executionContext
      });
      
      throw error;
    }
  }
}
```

## Real-time Monitoring

### Performance Dashboard
```typescript
// React components for performance monitoring
import { 
  AgentPerformanceDashboard,
  ResponseTimeChart,
  SuccessRateChart,
  TokenUsageChart,
  ErrorAnalysisChart 
} from '@/components/monitoring';

<AgentPerformanceDashboard agentId={agentId}>
  <ResponseTimeChart timeRange="24h" />
  <SuccessRateChart timeRange="7d" />
  <TokenUsageChart timeRange="30d" />
  <ErrorAnalysisChart timeRange="24h" />
</AgentPerformanceDashboard>
```

### Live Metrics Stream
```typescript
// WebSocket integration for real-time updates
const { data: liveMetrics } = useRealtimeMetrics(agentId);

useEffect(() => {
  if (liveMetrics?.responseTime > ALERT_THRESHOLD) {
    triggerPerformanceAlert('HIGH_RESPONSE_TIME', liveMetrics);
  }
}, [liveMetrics]);
```

### Performance Hooks
```typescript
// Custom hooks for performance data
const useAgentPerformance = (agentId: string, timeRange: string) => {
  return useQuery({
    queryKey: ['agent-performance', agentId, timeRange],
    queryFn: () => fetchPerformanceMetrics(agentId, timeRange),
    refetchInterval: 30000, // 30 second refresh
  });
};

const usePerformanceAlerts = (agentId?: string) => {
  return useQuery({
    queryKey: ['performance-alerts', agentId],
    queryFn: () => fetchActiveAlerts(agentId),
    refetchInterval: 10000, // 10 second refresh for alerts
  });
};
```

## Alerting System

### Alert Configuration
```typescript
interface AlertRule {
  id: string;
  agent_id?: string;           // Specific agent or all agents
  metric: string;              // Metric to monitor
  threshold: number;           // Alert threshold
  comparison: 'gt' | 'lt' | 'eq'; // Comparison operator
  severity: AlertSeverity;     // Alert severity level
  duration: number;            // Minimum duration before alert
  notifications: {
    email: boolean;
    webhook: boolean;
    dashboard: boolean;
  };
}

const alertRules: AlertRule[] = [
  {
    id: 'high-response-time',
    metric: 'response_time_ms',
    threshold: 10000,
    comparison: 'gt',
    severity: 'high',
    duration: 300, // 5 minutes
    notifications: { email: true, webhook: true, dashboard: true }
  },
  {
    id: 'low-success-rate', 
    metric: 'success_rate',
    threshold: 0.95,
    comparison: 'lt', 
    severity: 'critical',
    duration: 600, // 10 minutes
    notifications: { email: true, webhook: true, dashboard: true }
  }
];
```

### Alert Processing
```typescript
class AlertManager {
  async processMetrics(metrics: PerformanceMetrics): Promise<void> {
    for (const rule of this.alertRules) {
      const violation = this.checkThreshold(metrics, rule);
      
      if (violation) {
        const alert = await this.createAlert(rule, violation);
        await this.sendNotifications(alert);
      }
    }
  }
  
  async createAlert(rule: AlertRule, violation: Violation): Promise<Alert> {
    return await supabase
      .from('performance_alerts')
      .insert({
        agent_id: rule.agent_id,
        alert_type: rule.id,
        threshold_value: rule.threshold,
        actual_value: violation.actualValue,
        severity: rule.severity
      });
  }
  
  async sendNotifications(alert: Alert): Promise<void> {
    if (alert.severity === 'critical') {
      await this.sendImmediateNotification(alert);
    } else {
      await this.queueNotification(alert);
    }
  }
}
```

## Performance Analytics

### Trend Analysis
```typescript
interface PerformanceTrends {
  responseTimeTrend: {
    direction: 'improving' | 'degrading' | 'stable';
    changePercent: number;
    confidence: number;
  };
  successRateTrend: {
    direction: 'improving' | 'degrading' | 'stable';
    changePercent: number;
    confidence: number;
  };
  tokenUsageTrend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    costImpact: number;
  };
}
```

### Comparative Analytics
```typescript
// Compare agent performance
const useAgentComparison = (agentIds: string[], timeRange: string) => {
  return useQuery({
    queryKey: ['agent-comparison', agentIds, timeRange],
    queryFn: () => compareAgentPerformance(agentIds, timeRange)
  });
};

// Performance ranking
interface AgentRanking {
  agentId: string;
  agentName: string;
  performanceScore: number;   // Composite score 0-100
  rank: number;
  strengths: string[];        // Top performing metrics
  improvements: string[];     // Areas for improvement
}
```

### Anomaly Detection
```typescript
class AnomalyDetector {
  async detectAnomalies(
    agentId: string, 
    timeWindow: string
  ): Promise<Anomaly[]> {
    const baseline = await this.getBaseline(agentId);
    const currentMetrics = await this.getCurrentMetrics(agentId, timeWindow);
    
    return this.identifyAnomalies(baseline, currentMetrics);
  }
  
  private identifyAnomalies(
    baseline: PerformanceBaseline, 
    current: PerformanceMetrics
  ): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    // Statistical anomaly detection
    if (this.isStatisticalAnomaly(baseline.responseTime, current.responseTime)) {
      anomalies.push({
        type: 'response_time_anomaly',
        severity: this.calculateSeverity(baseline.responseTime, current.responseTime),
        description: `Response time ${current.responseTime}ms is ${this.getDeviationPercent(baseline.responseTime, current.responseTime)}% above normal`
      });
    }
    
    return anomalies;
  }
}
```

## Cost Monitoring

### Token Usage Tracking
```typescript
interface TokenUsageMetrics {
  daily: {
    date: string;
    totalTokens: number;
    promptTokens: number; 
    completionTokens: number;
    estimatedCost: number;
  }[];
  monthly: {
    month: string;
    totalCost: number;
    tokenBreakdown: {
      [modelName: string]: number;
    };
  }[];
  projections: {
    dailyAverage: number;
    monthlyProjection: number;
    yearlyProjection: number;
  };
}
```

### Cost Optimization
```typescript
class CostOptimizer {
  async analyzeTokenUsage(agentId: string): Promise<OptimizationRecommendations> {
    const usage = await this.getTokenUsage(agentId);
    
    return {
      modelOptimization: this.suggestModelChanges(usage),
      promptOptimization: this.analyzePromptEfficiency(usage),
      cachingOpportunities: this.identifyCachingOpportunities(usage),
      batchingOpportunities: this.identifyBatchingOpportunities(usage)
    };
  }
  
  suggestModelChanges(usage: TokenUsageData): ModelRecommendation[] {
    // Analyze if cheaper models could be used for certain tasks
    return this.analyzeModelFitness(usage);
  }
}
```

## Quality Metrics

### Output Quality Assessment
```typescript
interface QualityMetrics {
  contentQuality: {
    coherenceScore: number;      // 0-1 content coherence
    relevanceScore: number;      // 0-1 relevance to prompt  
    completenessScore: number;   // 0-1 completeness
    professionalismScore: number; // 0-1 professional tone
  };
  technicalQuality: {
    formatCompliance: number;    // 0-1 format adherence
    errorRate: number;          // Parse/format errors
    consistencyScore: number;   // Cross-execution consistency
  };
  userSatisfaction: {
    averageRating: number;      // 1-5 user ratings
    usageRetention: number;     // Return usage rate
    feedbackSentiment: number;  // -1 to 1 sentiment
  };
}
```

### Quality Monitoring
```typescript
// Automated quality assessment
class QualityAnalyzer {
  async assessOutputQuality(
    agentId: string,
    output: string,
    expectedFormat: string
  ): Promise<QualityScore> {
    const scores = await Promise.all([
      this.analyzeCoherence(output),
      this.checkFormatCompliance(output, expectedFormat),
      this.assessProfessionalism(output),
      this.validateCompleteness(output)
    ]);
    
    return this.calculateCompositeScore(scores);
  }
}
```

## Integration & Automation

### Automated Optimization  
```typescript
class PerformanceOptimizer {
  async optimizeAgent(agentId: string): Promise<OptimizationResult> {
    const metrics = await this.getPerformanceMetrics(agentId);
    const analysis = await this.analyzeBottlenecks(metrics);
    
    const optimizations = await this.generateOptimizations(analysis);
    const results = await this.applyOptimizations(agentId, optimizations);
    
    return {
      optimizationsApplied: optimizations,
      performanceImprovement: results.improvement,
      estimatedCostSavings: results.costSavings
    };
  }
}
```

### Continuous Integration
```typescript
// Performance testing in CI/CD
const performanceTests = [
  {
    name: 'response-time-test',
    threshold: 5000, // 5 seconds max
    test: () => measureResponseTime(sampleRequest)
  },
  {
    name: 'success-rate-test', 
    threshold: 0.98, // 98% success rate
    test: () => measureSuccessRate(testSuite)
  }
];
```

## Future Enhancements

### Planned Features
- **Predictive Analytics**: ML-powered performance predictions
- **Automated Scaling**: Dynamic resource allocation based on performance
- **Advanced Anomaly Detection**: AI-powered anomaly identification
- **Cost Optimization AI**: Automated cost optimization recommendations

### Technical Improvements
- **Real-time Stream Processing**: Event-driven monitoring architecture
- **Distributed Tracing**: End-to-end execution tracing
- **Performance Profiling**: Deep performance analysis tools
- **Capacity Planning**: Predictive capacity and scaling recommendations

---

**Related Documentation:**
- [Agent Relationships](./agent-relationships.md)
- [System Architecture](../SYSTEM_ARCHITECTURE.md)
- [Database Schema](../DATABASE_SCHEMA.md)