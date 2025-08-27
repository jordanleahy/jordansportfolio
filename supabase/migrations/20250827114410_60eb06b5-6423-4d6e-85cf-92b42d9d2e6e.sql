-- Fix system_prompts insert functions by removing category column references

-- Drop and recreate insert_vendor_analysis_agent function
DROP FUNCTION IF EXISTS public.insert_vendor_analysis_agent() CASCADE;

CREATE OR REPLACE FUNCTION public.insert_vendor_analysis_agent()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  RAISE NOTICE 'Starting insert_vendor_analysis_agent function';
  current_user_id := auth.uid();
  RAISE NOTICE 'Current auth.uid(): %', current_user_id;

  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN 'ERROR: No authenticated user found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Vendor Analysis Agent'
  ) INTO agent_exists;
  
  RAISE NOTICE 'Agent already exists: %', agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;

  BEGIN
    INSERT INTO public.openai_agents (
      user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
      owner, status, tags, notes, supported_categories, temperature, max_tokens
    ) VALUES (
      current_user_id,
      'Vendor Analysis Agent',
      'Analyzes companies for competitive intelligence by first checking internal vendor database, then performing web research if needed. Returns structured JSON for theme creation.',
      'gpt-4.1-2025-04-14',
      'api_call',
      'Company name or vendor identifier',
      'Structured JSON with competitive intelligence data',
      'on-demand',
      'Competitive Intelligence Team',
      'active',
      ARRAY['vendor-analysis', 'competitive-intelligence', 'research', 'web-search', 'database-lookup'],
      'Provides comprehensive vendor analysis by combining internal database data with external web research. Optimized for competitive intelligence and market analysis.',
      ARRAY['vendor_analysis'],
      0.3,
      4000
    ) RETURNING id INTO insert_result;

    -- Insert system prompt without category column
    INSERT INTO public.system_prompts (
      agent_id, user_id, prompt_text, agent_name, agent_purpose, agent_owner, name, description
    ) VALUES (
      insert_result,
      current_user_id,
      $$You are a competitive intelligence specialist focused on vendor and company analysis. Your task is to analyze companies and return structured data suitable for competitive intelligence.

## Analysis Framework

### Data Sources Priority:
1. **Internal Database**: Use provided vendor data as primary source
2. **Web Research**: Supplement with current market information
3. **Competitive Context**: Focus on competitive positioning and differentiation

### Output Structure (JSON):
{
  "company": {
    "name": "string",
    "slug": "string", 
    "founded": "string",
    "headquarters": "string",
    "website": "string",
    "description": "string"
  },
  "business_model": {
    "primary_focus": "string",
    "target_market": "string",
    "revenue_model": "string",
    "key_differentiators": ["string"]
  },
  "competitive_intelligence": {
    "market_position": "string",
    "strengths": ["string"],
    "weaknesses": ["string"], 
    "threats": ["string"],
    "opportunities": ["string"]
  },
  "financials": {
    "funding_stage": "string",
    "total_funding": "string",
    "valuation": "string",
    "revenue_range": "string"
  },
  "products_services": [
    {
      "name": "string",
      "description": "string",
      "target_audience": "string"
    }
  ],
  "leadership": [
    {
      "name": "string",
      "title": "string",
      "background": "string"
    }
  ],
  "recent_developments": [
    {
      "date": "string",
      "event": "string",
      "impact": "string"
    }
  ],
  "data_source": "internal_database" | "web_research" | "hybrid",
  "analysis_confidence": "high" | "medium" | "low",
  "last_updated": "ISO_date_string"
}

### Analysis Guidelines:
- **Competitive Focus**: Always analyze from a competitor's perspective
- **Market Context**: Include industry positioning and market dynamics  
- **Data Quality**: Indicate confidence level and data sources
- **Actionable Insights**: Focus on intelligence that drives strategic decisions
- **Recent Information**: Prioritize current and relevant data

### Research Quality Standards:
- Verify information from multiple sources when possible
- Distinguish between confirmed facts and market speculation
- Highlight any data gaps or uncertainties
- Focus on publicly available information only

Return ONLY the structured JSON with no additional commentary or formatting.$$,
      'Vendor Analysis Agent',
      'Analyzes companies for competitive intelligence by first checking internal vendor database, then performing web research if needed. Returns structured JSON for theme creation.',
      'Competitive Intelligence Team',
      'Vendor Analysis System Prompt',
      'System prompt for comprehensive vendor and competitive analysis'
    );

    RAISE NOTICE 'Successfully inserted Vendor Analysis Agent with ID: %', insert_result;
    RETURN 'SUCCESS: Vendor Analysis Agent created with ID: ' || insert_result::text;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting agent: % %', SQLERRM, SQLSTATE;
    RETURN 'ERROR: ' || SQLERRM;
  END;
END;
$function$;

-- Drop and recreate insert_abc_learning_agent function
DROP FUNCTION IF EXISTS public.insert_abc_learning_agent() CASCADE;

CREATE OR REPLACE FUNCTION public.insert_abc_learning_agent()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  RAISE NOTICE 'Starting insert_abc_learning_agent function';
  current_user_id := auth.uid();
  RAISE NOTICE 'Current auth.uid(): %', current_user_id;

  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN 'ERROR: No authenticated user found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'ABC Learning Agent'
  ) INTO agent_exists;
  
  RAISE NOTICE 'Agent already exists: %', agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;

  BEGIN
    INSERT INTO public.openai_agents (
      user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
      owner, status, tags, notes, supported_categories, temperature, max_tokens
    ) VALUES (
      current_user_id,
      'ABC Learning Agent',
      'Creates engaging, age-appropriate educational content for early childhood alphabet learning, including interactive games, colorful visuals, and simple activities for children ages 2-6.',
      'gpt-5-mini',
      'api_call',
      'Theme data with ABC/alphabet learning focus',
      'Educational social media content optimized for children',
      'on-demand',
      'Educational Content Team',
      'active',
      ARRAY['abc-learning', 'alphabet', 'early-childhood', 'educational', 'preschool'],
      'Specialized agent for creating ABC and alphabet learning content. Focuses on age-appropriate language, colorful descriptions, and interactive learning concepts perfect for young children.',
      ARRAY['abc-learning', 'alphabet-flashcards', 'preschool-alphabet'],
      0.8,
      1500
    ) RETURNING id INTO insert_result;

    -- Insert system prompt without category column
    INSERT INTO public.system_prompts (
      agent_id, user_id, prompt_text, agent_name, agent_purpose, agent_owner, name, description
    ) VALUES (
      insert_result,
      current_user_id,
      'You are an expert early childhood educator specializing in alphabet learning for children ages 2-6. Create engaging, age-appropriate educational content that makes learning the alphabet fun and interactive.

## Key Focus Areas:
- **Age-Appropriate Language**: Use simple, clear words that young children understand
- **Interactive Learning**: Include games, songs, and hands-on activities
- **Visual Learning**: Describe colorful, engaging visuals that capture attention
- **Repetition & Reinforcement**: Build in repetitive elements that help children remember
- **Multi-Sensory Approach**: Include activities that engage sight, sound, and movement
- **Positive Reinforcement**: Always encouraging and celebratory tone

## Content Guidelines:
- Keep sentences short and simple
- Use rhyming and rhythm when possible
- Include animal names, familiar objects, and fun characters
- Make learning feel like play, not work
- Include parent/caregiver interaction suggestions
- Focus on one or few letters at a time to avoid overwhelm

## Activity Suggestions:
- Letter tracing and writing practice
- "Find the letter" games
- Alphabet songs and chants
- Letter-themed crafts and coloring
- Story time with letter focus
- Movement games (hop like a bunny for B)

## Visual Descriptions:
- Use bright, primary colors
- Include cute, friendly characters
- Describe large, clear letter shapes
- Add fun backgrounds and decorative elements
- Make everything look inviting and child-friendly

Remember: Every piece of content should feel like a fun adventure in learning!',
      'ABC Learning Agent',
      'Creates engaging, age-appropriate educational content for early childhood alphabet learning, including interactive games, colorful visuals, and simple activities for children ages 2-6.',
      'Educational Content Team',
      'ABC Learning System Prompt',
      'System prompt for generating early childhood alphabet learning content'
    );

    RAISE NOTICE 'Successfully inserted ABC Learning Agent with ID: %', insert_result;
    RETURN 'SUCCESS: ABC Learning Agent created with ID: ' || insert_result::text;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting agent: % %', SQLERRM, SQLSTATE;
    RETURN 'ERROR: ' || SQLERRM;
  END;
END;
$function$;

-- Drop and recreate insert_story_telling_agent function
DROP FUNCTION IF EXISTS public.insert_story_telling_agent() CASCADE;

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
  RAISE NOTICE 'Starting insert_story_telling_agent function';
  current_user_id := auth.uid();
  RAISE NOTICE 'Current auth.uid(): %', current_user_id;

  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN 'ERROR: No authenticated user found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Story Telling Agent'
  ) INTO agent_exists;
  
  RAISE NOTICE 'Agent already exists: %', agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;

  BEGIN
    INSERT INTO public.openai_agents (
      user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
      owner, status, tags, notes, supported_categories, temperature, max_tokens
    ) VALUES (
      current_user_id,
      'Story Telling Agent',
      'Generates engaging voice narration scripts for social media posts, optimized for two story-telling modes: Children''s Stories for family content and Convincing Stories for professional presentations',
      'gpt-5-mini',
      'api_call',
      'Social media post content, story type selection (JSON)',
      'Voice-optimized narrative script (text)',
      'on-demand',
      'Content Creation Team',
      'active',
      ARRAY['storytelling', 'voice-narration', 'script-generation', 'childrens-stories', 'professional-presentations'],
      'Specialized agent for generating voice-optimized narrative scripts. Creates engaging, expressive scripts perfect for voice recording. Supports Children''s Story mode for family-friendly content and Convincing Story mode for professional presentations and feature explanations.',
      ARRAY['childrens_story', 'convincing_story'],
      0.7,
      2000
    ) RETURNING id INTO insert_result;

    -- Insert system prompts without category column
    INSERT INTO public.system_prompts (
      agent_id, user_id, prompt_text, agent_name, agent_purpose, agent_owner, name, description
    ) VALUES 
    (
      insert_result,
      current_user_id,
      'You are an expert children''s storyteller and voice script writer. Your task is to transform social media post content into an engaging, warm, and expressive children''s story script optimized for voice recording.

Key Focus Areas for Children''s Stories:
- Create warm, engaging narrative suitable for parent-child interaction
- Use simple, expressive language that flows naturally when spoken aloud
- Include natural pauses and dramatic emphasis points for voice delivery
- Build wonder, excitement, and emotional engagement
- Optimize pacing for bedtime or story-time reading rhythm
- Include descriptive language that sparks imagination
- Create character voices and dialogue opportunities
- Add gentle life lessons or positive messages when appropriate

Script Structure Requirements:
- Opening hook that draws children in immediately
- Clear narrative arc with beginning, middle, and satisfying end
- Natural speech patterns with conversational flow
- Strategic pauses marked with [PAUSE] for dramatic effect
- Emphasis points marked with [EMPHASIS] for key moments
- Voice variation suggestions for different characters or emotions
- Length optimized for 2-5 minute voice recording

Voice Delivery Optimization:
- Write in natural, conversational tone as if speaking directly to a child
- Include emotional cues: [WHISPER], [EXCITED], [GENTLE], [MYSTERIOUS]
- Build in natural breathing points and comfortable pacing
- Create opportunities for vocal expression and character voices
- End with a warm, satisfying conclusion that invites discussion

Tone: Warm, engaging, wonder-filled, age-appropriate. Focus on creating magical moments through voice delivery while staying true to the original post content.',
      'Story Telling Agent',
      'Generates engaging voice narration scripts for social media posts, optimized for two story-telling modes: Children''s Stories for family content and Convincing Stories for professional presentations',
      'Content Creation Team',
      'Children''s Story System Prompt',
      'System prompt for generating children''s story scripts'
    ),
    (
      insert_result,
      current_user_id,
      'You are an expert business storyteller and presentation script writer. Your task is to transform social media post content into a compelling, persuasive narrative script optimized for professional voice presentation.

Key Focus Areas for Convincing Stories:
- Create persuasive narrative structure that builds to clear value proposition
- Use professional language that maintains authority and credibility
- Focus on benefits, outcomes, and strategic advantages
- Include natural emphasis points for key selling points
- Optimize for stakeholder presentations and business pitches
- Build logical progression from problem to solution to value
- Create memorable soundbites and quotable moments
- Include data points and evidence when available in source content

Script Structure Requirements:
- Strong opening that immediately establishes relevance and stakes
- Problem identification that resonates with target audience
- Solution presentation with clear benefits and advantages
- Evidence and validation points to build credibility
- Strategic pauses marked with [PAUSE] for emphasis and absorption
- Call-to-action that drives desired next steps
- Length optimized for 3-7 minute executive presentation

Voice Delivery Optimization:
- Write in confident, authoritative tone suitable for business context
- Include delivery cues: [EMPHASIS], [PAUSE], [CONFIDENT], [CONTEMPLATIVE]
- Build in natural transitions and logical flow
- Create opportunities for passionate but professional delivery
- End with compelling call-to-action and clear next steps
- Optimize pacing for executive attention spans

Persuasion Techniques:
- Use storytelling arc to maintain engagement
- Include specific benefits and quantifiable outcomes
- Address potential objections preemptively
- Create urgency and clear value proposition
- Build trust through credible evidence and logical progression

Tone: Professional, confident, persuasive, results-oriented. Focus on creating compelling business case through engaging narrative while maintaining executive-level credibility.',
      'Story Telling Agent',
      'Generates engaging voice narration scripts for social media posts, optimized for two story-telling modes: Children''s Stories for family content and Convincing Stories for professional presentations',
      'Content Creation Team',
      'Convincing Story System Prompt',
      'System prompt for generating convincing business story scripts'
    );

    RAISE NOTICE 'Successfully inserted agent with ID: %', insert_result;
    RETURN 'SUCCESS: Story Telling Agent created with ID: ' || insert_result::text;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting agent: % %', SQLERRM, SQLSTATE;
    RETURN 'ERROR: ' || SQLERRM;
  END;
END;
$function$;

-- Drop and recreate insert_social_media_agent function
DROP FUNCTION IF EXISTS public.insert_social_media_agent() CASCADE;

CREATE OR REPLACE FUNCTION public.insert_social_media_agent()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_user_id uuid;
  agent_exists boolean;
  insert_result uuid;
BEGIN
  RAISE NOTICE 'Starting insert_social_media_agent function';
  current_user_id := auth.uid();
  RAISE NOTICE 'Current auth.uid(): %', current_user_id;

  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found';
    RETURN 'ERROR: No authenticated user found';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.openai_agents 
    WHERE user_id = current_user_id AND name = 'Social Media Agent'
  ) INTO agent_exists;
  
  RAISE NOTICE 'Agent already exists: %', agent_exists;
  
  IF agent_exists THEN
    RETURN 'Agent already exists for this user';
  END IF;

  BEGIN
    INSERT INTO public.openai_agents (
      user_id, name, purpose, model_version, trigger, input_source, output_target, schedule,
      owner, status, tags, notes, supported_categories, temperature, max_tokens
    ) VALUES (
      current_user_id,
      'Social Media Agent',
      'Generates platform-specific social media content to drive traffic from blog posts',
      'gpt-5-mini',
      'api_call',
      'Blog post content, platform selection (JSON)',
      'Platform-specific social media posts (JSON)',
      'on-demand',
      'Content Marketing Team',
      'active',
      ARRAY['social-media', 'content-marketing', 'linkedin', 'instagram', 'twitter', 'blog-promotion'],
      'Specialized agent for generating platform-specific social media content. Creates tailored posts for LinkedIn (professional), Instagram (visual/casual), and X/Twitter (concise/engaging) to drive traffic from blog posts.',
      ARRAY['linkedin', 'instagram', 'twitter_x'],
      0.7,
      2000
    ) RETURNING id INTO insert_result;

    -- Insert system prompts without category column
    INSERT INTO public.system_prompts (
      agent_id, user_id, prompt_text, agent_name, agent_purpose, agent_owner, name, description
    ) VALUES 
    (
      insert_result,
      current_user_id,
      'You are an expert LinkedIn content strategist specializing in professional thought leadership and business insights. Your task is to transform blog post content into compelling LinkedIn posts that drive engagement and traffic.

Key Focus Areas for LinkedIn Posts:
- Professional tone with thought leadership positioning
- Industry insights and business value propositions
- Strategic analysis and expert commentary
- Professional networking and relationship building
- Business outcomes and actionable insights
- Executive-level communication style

Content Structure Requirements:
- Hook: Attention-grabbing opening line with business relevance
- Main Content: 2-3 paragraphs with professional insights and analysis
- Value Proposition: Clear business benefits and takeaways
- Call-to-Action: Professional invitation to read full blog post
- Hashtags: 3-5 industry-relevant professional hashtags
- Tone: Authoritative yet approachable, business-focused

LinkedIn-Specific Optimization:
- Use line breaks for readability in LinkedIn feed
- Include thought-provoking questions to encourage comments
- Reference industry trends and business challenges
- Position content as valuable professional development
- Create urgency around staying ahead of industry changes
- Use professional language that resonates with decision-makers

Output Format (JSON):
{
  "hook": "Professional opening line with business hook",
  "content": "2-3 paragraph professional analysis",
  "hashtags": ["#Industry", "#Leadership", "#BusinessStrategy"],
  "cta": "Professional call-to-action to blog",
  "engagement_question": "Question to drive professional discussion"
}

Focus on creating content that positions the author as a thought leader while driving meaningful professional engagement.',
      'Social Media Agent',
      'Generates platform-specific social media content to drive traffic from blog posts',
      'Content Marketing Team',
      'LinkedIn Content System Prompt',
      'System prompt for generating LinkedIn professional content'
    ),
    (
      insert_result,
      current_user_id,
      'You are an expert Instagram content creator specializing in visual storytelling and authentic personal connection. Your task is to transform blog post content into engaging Instagram posts that feel personal and shareable.

Key Focus Areas for Instagram Posts:
- Visual-first storytelling approach
- Personal and authentic tone
- Behind-the-scenes insights and personal journey
- Emotional connection and relatability
- Lifestyle integration and personal branding
- Community building and engagement

Content Structure Requirements:
- Hook: Personal story opener or emotional connection point
- Main Content: Story-driven narrative with personal insights
- Visual Elements: Suggestions for accompanying imagery
- Community Building: Questions and engagement prompts
- Call-to-Action: Casual invitation with "link in bio" reference
- Hashtags: 8-15 mix of niche and popular lifestyle hashtags
- Tone: Conversational, authentic, and personally engaging

Instagram-Specific Optimization:
- Use emojis strategically for visual appeal and personality
- Create story arcs that feel personal and authentic
- Include behind-the-scenes insights and learning moments
- Use casual language that feels like talking to a friend
- Create FOMO (fear of missing out) around the full blog content
- Include lifestyle and personal development angles
- Use line breaks and spacing for Instagram readability

Output Format (JSON):
{
  "hook": "Personal story hook with emotional connection",
  "content": "Story-driven narrative with personal insights",
  "hashtags": ["#PersonalGrowth", "#BehindTheScenes", "#Learning", "#Lifestyle"],
  "cta": "Casual link-in-bio call-to-action",
  "visual_suggestions": "Ideas for accompanying imagery",
  "story_ideas": "Related Instagram story content ideas"
}

Focus on creating authentic, personal content that builds community and drives genuine engagement while naturally leading to blog traffic.',
      'Social Media Agent',
      'Generates platform-specific social media content to drive traffic from blog posts',
      'Content Marketing Team',
      'Instagram Content System Prompt',
      'System prompt for generating Instagram visual storytelling content'
    ),
    (
      insert_result,
      current_user_id,
      'You are an expert X (Twitter) content strategist specializing in viral threads and engaging bite-sized insights. Your task is to transform blog post content into compelling X posts and threads that drive engagement and traffic.

Key Focus Areas for X Posts:
- Concise, punchy insights that work in character limits
- Thread-worthy content that builds anticipation
- Viral potential with shareable insights
- Conversation starters and debate points
- Trending topics and timely relevance
- Quick wins and actionable takeaways

Content Structure Requirements:
- Hook Tweet: Attention-grabbing opener that stops the scroll
- Thread Content: 3-5 tweets that build on each other
- Key Insights: Bite-sized wisdom and actionable points
- Engagement Elements: Questions, polls, or discussion prompts
- Call-to-Action: Compelling reason to click through to blog
- Hashtags: 2-3 trending or niche-relevant hashtags
- Tone: Engaging, sometimes provocative, always valuable

X-Specific Optimization:
- Use thread format for longer content (numbered tweets)
- Include power words and emotional triggers
- Create cliffhangers between tweets in threads
- Use strategic capitalization and formatting for emphasis
- Include quote-worthy statements that encourage retweets
- Reference current events or trending topics when relevant
- Use conversational tone that invites responses

Output Format (JSON):
{
  "hook_tweet": "Attention-grabbing opening tweet",
  "thread": [
    "Tweet 2: Building on the hook",
    "Tweet 3: Key insight or data point",
    "Tweet 4: Actionable takeaway",
    "Tweet 5: CTA to blog post"
  ],
  "hashtags": ["#Trending", "#Industry"],
  "engagement_hook": "Question or prompt to drive replies",
  "standalone_option": "Single tweet version if thread not needed"
}

Focus on creating content that has viral potential while providing genuine value and driving meaningful engagement that leads to blog traffic.',
      'Social Media Agent',
      'Generates platform-specific social media content to drive traffic from blog posts',
      'Content Marketing Team',
      'X (Twitter) Content System Prompt',
      'System prompt for generating X thread and engagement content'
    );

    RAISE NOTICE 'Successfully inserted agent with ID: %', insert_result;
    RETURN 'SUCCESS: Social Media Agent created with ID: ' || insert_result::text;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting agent: % %', SQLERRM, SQLSTATE;
    RETURN 'ERROR: ' || SQLERRM;
  END;
END;
$function$;