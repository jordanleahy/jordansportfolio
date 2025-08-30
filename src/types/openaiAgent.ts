export type AgentStatus = 'active' | 'paused' | 'deprecated';

import { CategoryType } from '@/constants/categoryConstants';


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
  supported_categories?: string[];
  // Advanced model parameters
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
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
  supported_categories?: string[];
  // Advanced model parameters
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
  id: string;
}