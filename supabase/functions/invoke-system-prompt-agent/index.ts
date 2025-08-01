import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

// Constants
const AGENT_NAMES = {
  SYSTEM_PROMPT_GENERATOR: 'System Prompt Generator',
} as const;

const SYSTEM_PROMPT_CATEGORIES = {
  SYSTEM_PROMPT_GENERATION: 'system_prompt_generation',
} as const;

const OPENAI_CONFIG = {
  DEFAULT_TEMPERATURE: 0.1,
  DEFAULT_MODEL: 'gpt-4o-mini',
} as const;

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const ERROR_MESSAGES = {
  OPENAI_API_KEY_MISSING: 'OpenAI API key not configured',
  AGENT_NOT_FOUND: 'Required agent not found for this user',
  SYSTEM_PROMPT_NOT_FOUND: 'No system prompt found for specified category',
  INVALID_REQUEST_BODY: 'Invalid request body',
  OPENAI_API_ERROR: 'OpenAI API error',
} as const;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
} as const;

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  console.log('invoke-system-prompt-agent function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const requestBody = await req.json();
    const { category, theme, description, sample_posts, user_id, color_theme } = requestBody;
    
    // Input validation
    if (!category || !user_id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.INVALID_REQUEST_BODY 
      }), {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Processing request for category:', category, 'user_id:', user_id);

    if (!openAIApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.OPENAI_API_KEY_MISSING 
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the System Prompt Generator agent for this user
    const { data: agent, error: agentError } = await supabase
      .from('openai_agents')
      .select('*')
      .eq('name', AGENT_NAMES.SYSTEM_PROMPT_GENERATOR)
      .eq('user_id', user_id)
      .single();

    if (agentError || !agent) {
      console.error('System Prompt Generator agent not found:', agentError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.AGENT_NOT_FOUND 
      }), {
        status: HTTP_STATUS.NOT_FOUND,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found System Prompt Generator agent:', agent.id);

    // Get the system prompt for this agent
    const systemPrompts = agent.system_prompts || [];
    const systemPromptObj = systemPrompts.find((p: any) => p.category === SYSTEM_PROMPT_CATEGORIES.SYSTEM_PROMPT_GENERATION);
    
    if (!systemPromptObj) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: ERROR_MESSAGES.SYSTEM_PROMPT_NOT_FOUND 
      }), {
        status: HTTP_STATUS.NOT_FOUND,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = systemPromptObj.prompt;

    // Prepare the user prompt with the category and context
    let userPrompt = `Create a comprehensive system prompt for the "${category}" category.

Theme: ${theme || 'General'}
Description: ${description || 'No description provided'}

Sample content from this category:
${sample_posts?.map((post: any) => `- ${post.title}: ${post.description}`).join('\n') || 'No sample posts provided'}`;

    // Add color theme information if provided
    if (color_theme) {
      userPrompt += `

Color Theme Integration:
- Theme Name: ${color_theme.name}
- Primary Color: ${color_theme.primary_color}
- Secondary Color: ${color_theme.secondary_color}
- Accent Color: ${color_theme.accent_color}
- Background Color: ${color_theme.background_color}
- Text Color: ${color_theme.text_color}
- Border Color: ${color_theme.border_color}
- Visual Style: ${color_theme.visual_style}
- Color Instructions: ${color_theme.color_instructions}

IMPORTANT: Integrate this specific color theme throughout the system prompt. Replace the default color palette section with these exact colors and ensure all visual guidance incorporates the ${color_theme.name} theme.`;
    }

    userPrompt += `

Please generate a detailed, professional system prompt following the established template format with industry-specific visual frameworks, color palettes, and content analysis guidelines.${color_theme ? ` Make sure to incorporate the ${color_theme.name} color theme consistently throughout all sections, especially the color palette and visual style guidelines.` : ''}`;

    console.log('Calling OpenAI with system prompt length:', systemPrompt.length);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model_version || OPENAI_CONFIG.DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: OPENAI_CONFIG.DEFAULT_TEMPERATURE,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `${ERROR_MESSAGES.OPENAI_API_ERROR}: ${response.status}` 
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;

    console.log('Generated system prompt length:', generatedPrompt.length);

    // Update the agent's last_run timestamp
    const currentTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('openai_agents')
      .update({ 
        last_run: currentTimestamp,
        updated_at: currentTimestamp
      })
      .eq('id', agent.id);

    if (updateError) {
      console.error('Error updating agent last_run:', updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      system_prompt: generatedPrompt,
      agent_id: agent.id
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in invoke-system-prompt-agent function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});