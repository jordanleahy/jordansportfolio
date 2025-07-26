-- Create voiceover_scripts table for storing generated scripts
CREATE TABLE public.voiceover_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('blog_post', 'social_media_post')),
  original_content TEXT NOT NULL,
  generated_script TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'engaging',
  style TEXT NOT NULL DEFAULT 'teleprompter',
  word_count INTEGER,
  estimated_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voiceover_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies for voiceover_scripts
CREATE POLICY "Users can view their own voiceover scripts" 
ON public.voiceover_scripts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voiceover scripts" 
ON public.voiceover_scripts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voiceover scripts" 
ON public.voiceover_scripts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voiceover scripts" 
ON public.voiceover_scripts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_voiceover_scripts_updated_at
BEFORE UPDATE ON public.voiceover_scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Voiceover Script Generator agent
INSERT INTO public.openai_agents (
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
  user_id
) VALUES (
  'Voiceover Script Generator',
  'Transforms blog posts and calendar entries into teleprompter-style voiceover scripts for on-camera or voice narration. Creates engaging scripts with natural pacing, short line breaks, and strong hooks.',
  'gpt-4o',
  'api_call',
  'Blog content or calendar entry (JSON)',
  'Teleprompter-style voiceover script',
  'on-demand',
  'Content Marketing Team',
  'active',
  ARRAY['voiceover', 'script-generation', 'teleprompter', 'video-content', 'narration'],
  'Specialized agent for creating voiceover scripts from written content. Optimized for various tones and styles including teleprompter format for on-camera delivery.',
  '[
    {
      "category": "engaging",
      "prompt": "You are an expert voiceover script writer who transforms written content into engaging, teleprompter-style scripts for on-camera delivery.\\n\\nYour task:\\n1. Create a strong hook in the first 1-2 lines that grabs attention immediately\\n2. Rewrite content using short, punchy lines (max 12 words per line)\\n3. Use natural speech patterns and conversational tone\\n4. Add strategic pauses with line breaks between thoughts\\n5. End with a clear, memorable call-to-action\\n6. Write how a confident, engaging person would speak on camera\\n\\nFormat guidelines:\\n- One sentence or thought per line\\n- Use contractions and natural speech\\n- Avoid academic or robotic phrasing\\n- Include emotional hooks and relatable language\\n- Make it sound conversational, not written\\n\\nReturn only the script text, with each line on a new line."
    },
    {
      "category": "confident",
      "prompt": "You are an expert voiceover script writer who transforms written content into confident, authoritative teleprompter-style scripts.\\n\\nYour task:\\n1. Open with a bold, confident statement that establishes authority\\n2. Use declarative sentences with strong, clear language\\n3. Keep lines short and punchy (max 12 words per line)\\n4. Maintain an authoritative but approachable tone\\n5. Use power words and decisive language\\n6. End with a strong, action-oriented call-to-action\\n\\nTone guidelines:\\n- Speak with authority and expertise\\n- Use definitive statements (avoid hedge words like \\"maybe\\", \\"might\\")\\n- Sound like a trusted expert sharing knowledge\\n- Be direct and to-the-point\\n- Include confident transitions between ideas\\n\\nReturn only the script text, with each line on a new line."
    },
    {
      "category": "educational",
      "prompt": "You are an expert voiceover script writer who transforms written content into clear, educational teleprompter-style scripts for learning-focused delivery.\\n\\nYour task:\\n1. Start with a learning-focused hook that promises value\\n2. Break complex concepts into digestible, short lines\\n3. Use teaching language that guides the viewer\\n4. Include natural transitions and explanatory phrases\\n5. Make technical content accessible and easy to follow\\n6. End with a summary or next-step call-to-action\\n\\nEducational guidelines:\\n- Use clear, simple language\\n- Include \\"teaching moments\\" and explanations\\n- Break down complex ideas step-by-step\\n- Use phrases like \\"Here\'s what this means\\", \\"Let me explain\\"\\n- Sound like a helpful teacher or mentor\\n- Include recap elements\\n\\nReturn only the script text, with each line on a new line."
    },
    {
      "category": "energetic",
      "prompt": "You are an expert voiceover script writer who transforms written content into high-energy, dynamic teleprompter-style scripts for enthusiastic delivery.\\n\\nYour task:\\n1. Open with an exciting, high-energy hook\\n2. Use dynamic, action-oriented language\\n3. Keep the pace quick with short, punchy lines\\n4. Include excitement and enthusiasm in word choice\\n5. Use exclamation points and power words strategically\\n6. End with an energetic, motivating call-to-action\\n\\nEnergy guidelines:\\n- Use active voice and dynamic verbs\\n- Include excitement words (\\"amazing\\", \\"incredible\\", \\"game-changing\\")\\n- Keep momentum high throughout\\n- Use shorter sentences for quick delivery\\n- Sound like an enthusiastic presenter\\n- Include motivational language\\n\\nReturn only the script text, with each line on a new line."
    }
  ]'::jsonb,
  ARRAY['engaging', 'confident', 'educational', 'energetic'],
  '00000000-0000-0000-0000-000000000000'::uuid
) ON CONFLICT (name) DO UPDATE SET
  purpose = EXCLUDED.purpose,
  system_prompts = EXCLUDED.system_prompts,
  supported_categories = EXCLUDED.supported_categories,
  notes = EXCLUDED.notes;