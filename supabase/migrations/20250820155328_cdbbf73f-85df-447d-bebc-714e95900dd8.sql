-- Add unique constraint on (user_id, name) to support ON CONFLICT in insert_blog_agent function
ALTER TABLE public.openai_agents 
ADD CONSTRAINT unique_user_agent_name UNIQUE (user_id, name);