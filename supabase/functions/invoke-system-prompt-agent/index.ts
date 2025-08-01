import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  console.log('invoke-system-prompt-agent function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, theme, description, sample_posts, user_id } = await req.json();
    
    console.log('Processing request for category:', category, 'user_id:', user_id);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the System Prompt Generator agent for this user
    const { data: agent, error: agentError } = await supabase
      .from('openai_agents')
      .select('*')
      .eq('name', 'System Prompt Generator')
      .eq('user_id', user_id)
      .single();

    if (agentError || !agent) {
      console.error('System Prompt Generator agent not found:', agentError);
      throw new Error('System Prompt Generator agent not found for this user');
    }

    console.log('Found System Prompt Generator agent:', agent.id);

    // Get the system prompt for this agent
    const systemPrompts = agent.system_prompts || [];
    const systemPromptObj = systemPrompts.find((p: any) => p.category === 'system_prompt_generation');
    
    if (!systemPromptObj) {
      throw new Error('No system prompt found for system_prompt_generation category');
    }

    const systemPrompt = systemPromptObj.prompt;

    // Prepare the user prompt with the category and context
    const userPrompt = `Create a comprehensive system prompt for the "${category}" category.

Theme: ${theme || 'General'}
Description: ${description || 'No description provided'}

Sample content from this category:
${sample_posts?.map((post: any) => `- ${post.title}: ${post.description}`).join('\n') || 'No sample posts provided'}

Please generate a detailed, professional system prompt following the established template format with industry-specific visual frameworks, color palettes, and content analysis guidelines.`;

    console.log('Calling OpenAI with system prompt length:', systemPrompt.length);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agent.model_version || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content;

    console.log('Generated system prompt length:', generatedPrompt.length);

    // Update the agent's last_run timestamp
    const { error: updateError } = await supabase
      .from('openai_agents')
      .update({ 
        last_run: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in invoke-system-prompt-agent function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});