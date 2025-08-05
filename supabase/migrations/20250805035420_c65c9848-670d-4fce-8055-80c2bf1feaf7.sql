-- Create story_recordings table
CREATE TABLE public.story_recordings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.social_media_posts(id) ON DELETE CASCADE,
  story_type TEXT NOT NULL CHECK (story_type IN ('childrens_story', 'convincing_story')),
  generated_script TEXT NOT NULL,
  audio_file_url TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on story_recordings
ALTER TABLE public.story_recordings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for story_recordings
CREATE POLICY "Users can create their own story recordings" 
ON public.story_recordings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own story recordings" 
ON public.story_recordings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own story recordings" 
ON public.story_recordings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own story recordings" 
ON public.story_recordings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_story_recordings_updated_at
BEFORE UPDATE ON public.story_recordings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to insert Story Telling Agent
CREATE OR REPLACE FUNCTION public.insert_story_telling_agent()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  -- Log the start of function execution
  RAISE NOTICE 'Starting insert_story_telling_agent function';
  
  -- Get current user ID and log it
  current_user_id := auth.uid();
  RAISE NOTICE 'Current auth.uid(): %', current_user_id;
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN 'ERROR: No authenticated user found';
  END IF;
  
  -- Check if agent already exists for this user
  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Story Telling Agent'
  ) INTO agent_exists;
  
  RAISE NOTICE 'Agent already exists: %', agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;
  
  -- Attempt to insert the agent
  BEGIN
    INSERT INTO public.openai_agents (
      user_id,
      name, 
      purpose, 
      model_version, 
      trigger, 
      input_source, 
      output_target, 
      schedule, 
      owner, 
      status, 
      tags, 
      notes,
      system_prompts,
      supported_categories,
      temperature,
      max_tokens
    ) VALUES (
      current_user_id,
      'Story Telling Agent',
      'Generates engaging voice narration scripts for social media posts, optimized for two story-telling modes: Children''s Stories for family content and Convincing Stories for professional presentations',
      'gpt-4.1-2025-04-14',
      'api_call',
      'Social media post content, story type selection (JSON)',
      'Voice-optimized narrative script (text)',
      'on-demand',
      'Content Creation Team',
      'active',
      ARRAY['storytelling', 'voice-narration', 'script-generation', 'childrens-stories', 'professional-presentations'],
      'Specialized agent for generating voice-optimized narrative scripts. Creates engaging, expressive scripts perfect for voice recording. Supports Children''s Story mode for family-friendly content and Convincing Story mode for professional presentations and feature explanations.',
      '[
        {
          "category": "childrens_story",
          "prompt": "You are an expert children''s storyteller and voice script writer. Your task is to transform social media post content into an engaging, warm, and expressive children''s story script optimized for voice recording.\\n\\nKey Focus Areas for Children''s Stories:\\n- Create warm, engaging narrative suitable for parent-child interaction\\n- Use simple, expressive language that flows naturally when spoken aloud\\n- Include natural pauses and dramatic emphasis points for voice delivery\\n- Build wonder, excitement, and emotional engagement\\n- Optimize pacing for bedtime or story-time reading rhythm\\n- Include descriptive language that sparks imagination\\n- Create character voices and dialogue opportunities\\n- Add gentle life lessons or positive messages when appropriate\\n\\nScript Structure Requirements:\\n- Opening hook that draws children in immediately\\n- Clear narrative arc with beginning, middle, and satisfying end\\n- Natural speech patterns with conversational flow\\n- Strategic pauses marked with [PAUSE] for dramatic effect\\n- Emphasis points marked with [EMPHASIS] for key moments\\n- Voice variation suggestions for different characters or emotions\\n- Length optimized for 2-5 minute voice recording\\n\\nVoice Delivery Optimization:\\n- Write in natural, conversational tone as if speaking directly to a child\\n- Include emotional cues: [WHISPER], [EXCITED], [GENTLE], [MYSTERIOUS]\\n- Build in natural breathing points and comfortable pacing\\n- Create opportunities for vocal expression and character voices\\n- End with a warm, satisfying conclusion that invites discussion\\n\\nTone: Warm, engaging, wonder-filled, age-appropriate. Focus on creating magical moments through voice delivery while staying true to the original post content."
        },
        {
          "category": "convincing_story",
          "prompt": "You are an expert business storyteller and presentation script writer. Your task is to transform social media post content into a compelling, persuasive narrative script optimized for professional voice presentation.\\n\\nKey Focus Areas for Convincing Stories:\\n- Create persuasive narrative structure that builds to clear value proposition\\n- Use professional language that maintains authority and credibility\\n- Focus on benefits, outcomes, and strategic advantages\\n- Include natural emphasis points for key selling points\\n- Optimize for stakeholder presentations and business pitches\\n- Build logical progression from problem to solution to value\\n- Create memorable soundbites and quotable moments\\n- Include data points and evidence when available in source content\\n\\nScript Structure Requirements:\\n- Strong opening that immediately establishes relevance and stakes\\n- Problem identification that resonates with target audience\\n- Solution presentation with clear benefits and advantages\\n- Evidence and validation points to build credibility\\n- Strategic pauses marked with [PAUSE] for emphasis and absorption\\n- Call-to-action that drives desired next steps\\n- Length optimized for 3-7 minute executive presentation\\n\\nVoice Delivery Optimization:\\n- Write in confident, authoritative tone suitable for business context\\n- Include delivery cues: [EMPHASIS], [PAUSE], [CONFIDENT], [CONTEMPLATIVE]\\n- Build in natural transitions and logical flow\\n- Create opportunities for passionate but professional delivery\\n- End with compelling call-to-action and clear next steps\\n- Optimize pacing for executive attention spans\\n\\nPersuasion Techniques:\\n- Use storytelling arc to maintain engagement\\n- Include specific benefits and quantifiable outcomes\\n- Address potential objections preemptively\\n- Create urgency and clear value proposition\\n- Build trust through credible evidence and logical progression\\n\\nTone: Professional, confident, persuasive, results-oriented. Focus on creating compelling business case through engaging narrative while maintaining executive-level credibility."
        }
      ]'::jsonb,
      ARRAY['childrens_story', 'convincing_story'],
      0.7,
      2000
    ) RETURNING id INTO insert_result;
    
    RAISE NOTICE 'Successfully inserted agent with ID: %', insert_result;
    RETURN 'SUCCESS: Story Telling Agent created with ID: ' || insert_result::text;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting agent: % %', SQLERRM, SQLSTATE;
    RETURN 'ERROR: ' || SQLERRM;
  END;
  
END;
$function$;