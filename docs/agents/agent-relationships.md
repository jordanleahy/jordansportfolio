# Agent Relationships & Dependencies

## Overview

The Agent Relationship system manages dependencies, workflows, and interactions between agents to ensure proper execution order and data flow coordination.

## Relationship Types

### Dependency Relationships
```typescript
interface AgentRelationship {
  source_agent_id: string;     // Dependent agent
  target_agent_id: string;     // Required dependency
  relationship_type: string;   // Type of dependency
  is_required: boolean;        // Critical vs optional
  description?: string;        // Relationship context
}
```

### Relationship Categories

#### Sequential Dependencies
- **Purpose**: Ensures agents execute in proper order
- **Use Case**: System Prompt Agent → Visual Prompt Generator
- **Enforcement**: Target agent must complete before source agent starts

#### Parallel Dependencies  
- **Purpose**: Agents that can run simultaneously but share data
- **Use Case**: Multiple content generators using same theme data
- **Enforcement**: Shared resource coordination without blocking

#### Conditional Dependencies
- **Purpose**: Dependencies that activate based on conditions
- **Use Case**: Error recovery agents that activate on failures
- **Enforcement**: Dynamic activation based on runtime conditions

## Database Schema

### Core Tables
```sql
-- Agent relationships table
CREATE TABLE agent_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_agent_id uuid NOT NULL REFERENCES openai_agents,
  target_agent_id uuid NOT NULL REFERENCES openai_agents,
  relationship_type text DEFAULT 'dependency',
  is_required boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent dependency tracking
CREATE TABLE agent_dependency_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES openai_agents,
  depends_on_agent_id uuid NOT NULL REFERENCES openai_agents,
  status dependency_status DEFAULT 'pending',
  last_checked timestamptz DEFAULT now()
);
```

### Status Types
```sql
CREATE TYPE dependency_status AS ENUM (
  'pending',    -- Dependency not yet satisfied
  'ready',      -- Dependency satisfied, can execute
  'blocked',    -- Dependency failed or unavailable
  'running',    -- Currently executing
  'completed',  -- Successfully completed
  'failed'      -- Execution failed
);
```

## Dependency Management

### Dependency Resolution Engine
```typescript
class DependencyResolver {
  async resolveDependencies(agentId: string): Promise<DependencyResult> {
    const dependencies = await this.getDependencies(agentId);
    const status = await this.checkDependencyStatus(dependencies);
    
    return {
      isReady: status.every(dep => dep.status === 'ready'),
      blockedBy: status.filter(dep => dep.status === 'blocked'),
      pendingDependencies: status.filter(dep => dep.status === 'pending')
    };
  }
  
  async validateCircularDependencies(
    sourceId: string, 
    targetId: string
  ): Promise<ValidationResult> {
    const dependencyChain = await this.buildDependencyChain(sourceId);
    return {
      hasCircularDependency: dependencyChain.includes(targetId),
      dependencyPath: dependencyChain
    };
  }
}
```

### Execution Coordination
```typescript
interface ExecutionPlan {
  executionOrder: string[];     // Agent execution sequence
  parallelGroups: string[][];   // Agents that can run in parallel
  conditionalAgents: {          // Conditional execution rules
    agentId: string;
    conditions: ExecutionCondition[];
  }[];
  fallbackAgents: string[];     // Recovery agents for failures
}
```

## Relationship Patterns

### Common Dependency Chains

#### Content Generation Workflow
```
System Prompt Agent → Visual Prompt Generator → Image Generation → Blog Content Generator
```

#### Multi-Platform Publishing  
```
Blog Content Generator → Social Media Agent → Platform-Specific Agents
```

#### Quality Assurance Pipeline
```
Content Generator → Quality Checker → Approval Agent → Publisher Agent
```

### Parallel Processing Groups
```typescript
const parallelProcessingGroups = {
  contentGeneration: [
    'Visual Prompt Generator',
    'Blog Content Generator', 
    'Social Media Agent'
  ],
  qualityAssurance: [
    'Grammar Checker Agent',
    'Compliance Validator', 
    'Brand Consistency Checker'
  ]
};
```

## Frontend Integration

### Dependency Visualization
```typescript
// React component for dependency graph
import { AgentDependencyGraph } from '@/components/agents/AgentDependencyGraph';

<AgentDependencyGraph
  agentId={selectedAgentId}
  showDependencies={true}
  showDependents={true}
  interactive={true}
  onNodeClick={handleNodeClick}
/>
```

### Relationship Management
```typescript
// Hook for managing relationships
const {
  relationships,
  createRelationship,
  updateRelationship,
  deleteRelationship
} = useAgentRelationships(agentId);

// Create new dependency
await createRelationship({
  source_agent_id: agentId,
  target_agent_id: dependencyId,
  relationship_type: 'dependency',
  is_required: true
});
```

## Real-time Dependency Tracking

### Status Updates
```typescript
// WebSocket integration for live dependency status
const { data: dependencyStatus } = useRealtimeDependencyStatus(agentId);

// Status change notifications
useEffect(() => {
  if (dependencyStatus?.status === 'ready') {
    // Agent can now execute
    triggerAgentExecution(agentId);
  }
}, [dependencyStatus]);
```

### Execution Monitoring
```typescript
interface ExecutionMonitor {
  trackExecution(agentId: string): void;
  onExecutionComplete(agentId: string, result: ExecutionResult): void;
  onExecutionFailure(agentId: string, error: Error): void;
  updateDependentAgents(agentId: string, status: string): void;
}
```

## Performance Optimization

### Dependency Caching
```typescript
const dependencyCacheConfig = {
  dependencyMaps: "15m TTL",      // Cache dependency graphs
  statusChecks: "1m TTL",         // Cache status checks
  executionPlans: "5m TTL",       // Cache execution plans
  circularValidation: "30m TTL"   // Cache circular dependency checks
};
```

### Batch Operations
```typescript
// Bulk dependency operations
async function bulkCreateDependencies(
  relationships: CreateRelationshipData[]
): Promise<BatchResult> {
  const validatedRelationships = await validateBatch(relationships);
  return await createRelationshipsBatch(validatedRelationships);
}
```

## Error Handling & Recovery

### Dependency Failures
```typescript
const failureRecoveryStrategies = {
  requiredDependencyFailed: {
    action: "halt_execution",
    notification: "alert_user",
    fallback: "manual_intervention"
  },
  optionalDependencyFailed: {
    action: "continue_execution", 
    notification: "log_warning",
    fallback: "default_behavior"
  },
  circularDependencyDetected: {
    action: "reject_creation",
    notification: "show_error",
    fallback: "suggest_alternatives"
  }
};
```

### Recovery Mechanisms
```typescript
class DependencyRecoveryManager {
  async handleDependencyFailure(
    agentId: string, 
    failedDependency: string
  ): Promise<RecoveryAction> {
    const relationship = await this.getRelationship(agentId, failedDependency);
    
    if (relationship.is_required) {
      return this.haltExecutionWithAlert(agentId);
    } else {
      return this.continueWithFallback(agentId);
    }
  }
  
  async suggestAlternativeDependencies(
    agentId: string,
    failedDependency: string  
  ): Promise<string[]> {
    // AI-powered suggestions for alternative dependencies
    return await this.findCompatibleAgents(agentId);
  }
}
```

## Validation & Constraints

### Relationship Validation Rules
```typescript
const validationRules = {
  noSelfDependencies: "Agent cannot depend on itself",
  noCircularDependencies: "Prevent circular dependency chains", 
  compatibleAgentTypes: "Verify agent compatibility",
  resourceConstraints: "Check resource availability",
  userPermissions: "Validate user access to both agents"
};
```

### Constraint Enforcement
```sql
-- Prevent self-dependencies
ALTER TABLE agent_relationships 
ADD CONSTRAINT no_self_dependency 
CHECK (source_agent_id != target_agent_id);

-- Unique relationship constraint
ALTER TABLE agent_relationships 
ADD CONSTRAINT unique_agent_relationship 
UNIQUE (source_agent_id, target_agent_id, relationship_type);
```

## Monitoring & Analytics

### Relationship Metrics
```typescript
interface RelationshipMetrics {
  totalRelationships: number;
  dependencyChainDepth: number;
  circularDependencies: number;
  failureRates: {
    [agentId: string]: number;
  };
  executionTimes: {
    [agentId: string]: number[];
  };
  bottleneckAgents: string[];
}
```

### Performance Analytics
```typescript
// Track dependency performance
const dependencyAnalytics = {
  averageResolutionTime: "Time to resolve dependencies",
  dependencyFailureRate: "Rate of dependency failures",
  executionBottlenecks: "Agents causing execution delays", 
  parallelizationEfficiency: "Effective use of parallel processing"
};
```

## Future Enhancements

### Planned Features
- **Dynamic Dependencies**: Runtime dependency modification
- **Conditional Execution**: Advanced conditional logic
- **Resource-Aware Scheduling**: Dependency resolution with resource constraints
- **Predictive Analytics**: ML-powered dependency optimization

### Technical Improvements
- **Graph Database**: Native graph storage for complex relationships
- **Distributed Execution**: Multi-node dependency coordination
- **Advanced Validation**: AI-powered relationship optimization
- **Real-time Orchestration**: Live workflow management

---

**Related Documentation:**
- [Agent Templates](./agent-templates.md)
- [Performance Monitoring](./performance-monitoring.md)
- [System Architecture Overview](../SYSTEM_ARCHITECTURE.md)