-- Create function to insert blog content generation agent for a user
CREATE OR REPLACE FUNCTION public.insert_blog_agent()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only insert if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.openai_agents (
      user_id, name, purpose, model_version, trigger, input_source, 
      output_target, schedule, owner, status, metrics, tags, notes
    ) VALUES (
      auth.uid(), 
      'Blog Content Generator', 
      'Specialized AI agent for transforming social media posts into comprehensive, authoritative blog content for healthcare professionals. Uses custom prompts optimized for healthcare industry content with focus on clinical documentation, revenue cycle management, and healthcare technology.',
      'gpt-4o',
      'api_call',
      'Social media post data (JSON)',
      'Blog post draft in database',
      'on-demand',
      'Content Marketing Team',
      'active',
      '{"latencyMs": 2500, "errorRate": 0.01}',
      ARRAY['blog', 'content-generation', 'healthcare', 'ai-writing', 'marketing'],
      'Dedicated blog content generation agent with healthcare-focused prompts. Uses GPT-4o for high-quality output. Generates comprehensive blog posts with proper SEO optimization, structured sections, and actionable insights for healthcare professionals.'
    )
    ON CONFLICT (user_id, name) DO NOTHING; -- Prevent duplicates
  END IF;
END;
$function$;