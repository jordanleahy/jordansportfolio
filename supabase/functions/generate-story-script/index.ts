/**
 * EDGE FUNCTION: Generate Story Script
 * 
 * PURPOSE:
 * Transforms social media post content into engaging voice-optimized story scripts using AI.
 * Supports two modes: Children's Stories for family content and Convincing Stories for 
 * professional presentations. Automatically creates or uses existing Story Telling Agent.
 * 
 * INPUTS:
 * - post_content: string - Source content to transform into story script
 * - story_type: string ('childrens_story' | 'convincing_story') - Story style for appropriate prompt selection
 * - post_title: string (optional) - Title for context
 * 
 * OUTPUTS:
 * - Success: { script: string, story_type: string, agent_id: string }
 * - Error: { error: string, details: string }
 * 
 * DEPENDENCIES:
 * - OpenAI API (GPT-5 for script generation)
 * - Supabase Database (openai_agents, system_prompts tables)
 * - Database Function (insert_story_telling_agent for agent creation)
 * 
 * USAGE:
 * Called from: Story creation workflows, voice recording preparation, content transformation
 * Authentication: Required - uses user context for agent management and script generation
 * 
 * IMPORTANT: OpenAI API Guidelines for this function
 * 
 * ✅ REQUIRED MODELS: Use GPT-5 family only
 * - gpt-5-2025-08-07 (flagship)
 * - gpt-5-mini-2025-08-07 (faster)  
 * - gpt-5-nano-2025-08-07 (fastest)
 * 
 * ❌ NEVER USE: GPT-4 models (gpt-4, gpt-4o, gpt-4.1, etc.)
 * ❌ NEVER USE: temperature parameter (not supported in GPT-5)
 * ❌ NEVER USE: max_tokens parameter (use max_completion_tokens instead)
 * 
 * FLOW:
 * 1. Authenticate user and validate story type (childrens_story or convincing_story)
 * 2. Find or create user's Story Telling Agent using database function
 * 3. Retrieve story-type-specific system prompt from system_prompts table
 * 4. Transform content using OpenAI with voice-optimized storytelling prompts
 * 5. Return generated script with voice delivery cues and formatting
 * 6. Support for both family-friendly and professional narrative styles
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  console.log('Generate story script function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      throw new Error('User not authenticated');
    }

    const { post_content, story_type, post_title } = await req.json();
    console.log('Request data:', { post_content: post_content?.substring(0, 100), story_type, post_title });

    if (!post_content || !story_type) {
      throw new Error('Missing required fields: post_content and story_type');
    }

    if (!['childrens_story', 'convincing_story'].includes(story_type)) {
      throw new Error('Invalid story_type. Must be "childrens_story" or "convincing_story"');
    }

    // Get the Story Telling Agent for this user
    const { data: agents, error: agentsError } = await supabaseClient
      .from('openai_agents')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', 'Story Telling Agent')
      .eq('status', 'active')
      .limit(1);

    if (agentsError) {
      console.error('Error fetching Story Telling Agent:', agentsError);
      throw new Error('Failed to fetch Story Telling Agent');
    }

    if (!agents || agents.length === 0) {
      console.log('Story Telling Agent not found, creating one...');
      
      // Create the agent using the database function
      const { data: createResult, error: createError } = await supabaseClient
        .rpc('insert_story_telling_agent');

      if (createError) {
        console.error('Error creating Story Telling Agent:', createError);
        throw new Error('Failed to create Story Telling Agent');
      }

      console.log('Agent creation result:', createResult);

      // Fetch the newly created agent
      const { data: newAgents, error: newAgentsError } = await supabaseClient
        .from('openai_agents')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'Story Telling Agent')
        .eq('status', 'active')
        .limit(1);

      if (newAgentsError || !newAgents || newAgents.length === 0) {
        console.error('Error fetching newly created agent:', newAgentsError);
        throw new Error('Failed to fetch newly created Story Telling Agent');
      }

      agents.push(...newAgents);
    }

    const agent = agents[0];
    console.log('Using agent:', agent.id);

    // Get the appropriate system prompt for the story type from the system_prompts table
    const { data: systemPromptData, error: promptError } = await supabaseClient
      .from('system_prompts')
      .select('prompt_text')
      .eq('agent_id', agent.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (promptError || !systemPromptData) {
      console.error('No system prompt found for story type:', story_type, promptError);
      throw new Error(`No system prompt configured for story type: ${story_type}`);
    }

    console.log('Using system prompt for category:', story_type);

    // Prepare the content for OpenAI
    const userPrompt = `
Title: ${post_title || 'Untitled Post'}

Content:
${post_content}

Please transform this content into an engaging ${story_type === 'childrens_story' ? 'children\'s story' : 'convincing business story'} script optimized for voice recording.
`;

    console.log('Sending request to OpenAI...');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model_version || 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPromptData.prompt_text },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: agent.max_completion_tokens || 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedScript = data.choices[0].message.content;

    console.log('Story script generated successfully, length:', generatedScript.length);

    return new Response(JSON.stringify({ 
      script: generatedScript,
      story_type,
      agent_id: agent.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story-script function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});