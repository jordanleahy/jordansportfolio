
-- Create enum for agent status
CREATE TYPE agent_status AS ENUM ('active', 'paused', 'deprecated');

-- Create the openai_agents table
CREATE TABLE public.openai_agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  purpose text NOT NULL,
  model_version text NOT NULL DEFAULT 'gpt-4o-mini',
  trigger text NOT NULL,
  input_source text NOT NULL,
  output_target text NOT NULL,
  schedule text NOT NULL DEFAULT 'manual',
  owner text NOT NULL,
  status agent_status NOT NULL DEFAULT 'active',
  last_run timestamp with time zone,
  metrics jsonb DEFAULT '{"latencyMs": 0, "errorRate": 0}'::jsonb,
  tags text[] DEFAULT '{}',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.openai_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see and manage their own agents
CREATE POLICY "Users can view their own agents"
  ON public.openai_agents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agents"
  ON public.openai_agents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agents"
  ON public.openai_agents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agents"
  ON public.openai_agents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.openai_agents
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert some sample data for development (will be tied to authenticated users)
CREATE OR REPLACE FUNCTION public.insert_sample_agents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only insert if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.openai_agents (
      user_id, name, purpose, model_version, trigger, input_source, 
      output_target, schedule, owner, status, last_run, metrics, tags, notes
    ) VALUES
    (
      auth.uid(), 
      'Content Generator', 
      'Generates blog posts and social media content based on trending topics',
      'gpt-4o',
      'webhook',
      'RSS feeds, social media APIs',
      'WordPress, Buffer',
      'daily at 9:00 AM',
      'Marketing Team',
      'active',
      now() - interval '2 hours',
      '{"latencyMs": 1200, "errorRate": 0.02}',
      ARRAY['content', 'marketing', 'automation'],
      'Performs well, may need tuning for better engagement rates'
    ),
    (
      auth.uid(),
      'Customer Support Bot',
      'Handles common customer inquiries and routes complex issues to human agents',
      'gpt-4o-mini',
      'chat_message',
      'Zendesk API',
      'Zendesk tickets',
      'real-time',
      'Support Team',
      'active',
      now() - interval '5 minutes',
      '{"latencyMs": 800, "errorRate": 0.01}',
      ARRAY['support', 'customer-service', 'chatbot'],
      'High satisfaction scores, handles 85% of tier-1 issues'
    ),
    (
      auth.uid(),
      'Code Reviewer',
      'Reviews pull requests for code quality, security issues, and best practices',
      'gpt-4o',
      'github_webhook',
      'GitHub API',
      'GitHub comments',
      'on pull request',
      'Engineering Team',
      'paused',
      now() - interval '1 day',
      '{"latencyMs": 2100, "errorRate": 0.05}',
      ARRAY['code-review', 'development', 'quality-assurance'],
      'Temporarily paused for model fine-tuning'
    ),
    (
      auth.uid(),
      'Legacy Email Parser',
      'Extracts data from legacy email formats and migrates to new system',
      'gpt-3.5-turbo',
      'email_received',
      'IMAP server',
      'Database API',
      'real-time',
      'Data Migration Team',
      'deprecated',
      now() - interval '2 weeks',
      '{"latencyMs": 3200, "errorRate": 0.15}',
      ARRAY['legacy', 'email', 'data-migration'],
      'Replaced by newer parsing agent with better accuracy'
    );
  END IF;
END;
$$;
