export type AgentStatus = 'active' | 'paused' | 'deprecated';

export interface OpenAIAgent {
  id: string;
  user_id: string;
  name: string;
  purpose: string;
  model_version: string;
  trigger: string;
  input_source: string;
  output_target: string;
  schedule: string;
  owner: string;
  status: AgentStatus;
  last_run?: string;
  metrics?: {
    latencyMs: number;
    errorRate: number;
  };
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentData {
  name: string;
  purpose: string;
  model_version: string;
  trigger: string;
  input_source: string;
  output_target: string;
  schedule: string;
  owner: string;
  status: AgentStatus;
  tags?: string[];
  notes?: string;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
  id: string;
}