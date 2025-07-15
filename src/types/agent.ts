export interface Agent {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  category: string;
  example_prompts: string[];
  tags: string[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentData {
  name: string;
  slug: string;
  description?: string;
  system_prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  category?: string;
  example_prompts?: string[];
  tags?: string[];
  avatar_url?: string;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
  is_active?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  agent_id: string;
  messages: Message[];
  created_at: Date;
  updated_at: Date;
}