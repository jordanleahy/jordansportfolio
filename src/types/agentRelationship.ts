export interface AgentRelationship {
  id: string;
  source_agent_id: string;
  target_agent_id: string;
  relationship_type: string;
  description?: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentRelationshipData {
  source_agent_id: string;
  target_agent_id: string;
  relationship_type?: string;
  description?: string;
  is_required?: boolean;
}

export interface UpdateAgentRelationshipData extends Partial<CreateAgentRelationshipData> {
  id: string;
}

export interface AgentDependency {
  agent_id: string;
  agent_name: string;
  relationship_type: string;
  depth: number;
  is_required: boolean;
}

export interface AgentWithRelationships {
  id: string;
  name: string;
  purpose: string;
  model_version: string;
  trigger: string;
  input_source: string;
  output_target: string;
  schedule: string;
  owner: string;
  status: string;
  last_run?: string;
  metrics?: {
    latencyMs: number;
    errorRate: number;
  };
  tags?: string[];
  notes?: string;
  system_prompts?: any[];
  supported_categories?: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  dependencies?: AgentDependency[];
  dependents?: AgentDependency[];
  blocked_by?: string[];
  dependency_status?: 'ready' | 'blocked' | 'unknown';
}

export interface DependencyValidationResult {
  isValid: boolean;
  hasCircularDependency: boolean;
  invalidDependencies: string[];
  suggestedDependencies?: string[];
}