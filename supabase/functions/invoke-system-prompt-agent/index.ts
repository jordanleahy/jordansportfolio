import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

// Constants
const AGENT_NAMES = {
  SYSTEM_PROMPT_GENERATOR: 'System Prompt Generator',
  VISUAL_PROMPT_GENERATOR: 'Visual Prompt Generator',
  BLOG_CONTENT_GENERATOR: 'Blog Content Generator',
  COVER_LETTER_GENERATOR: 'Cover Letter Generator',
  CALENDAR_THEME_JSON_PROCESSOR: 'Calendar Theme JSON Processor',
} as const;

// This function has been removed - only System Prompt Generator is allowed

const SYSTEM_PROMPT_CATEGORIES = {
  SYSTEM_PROMPT_GENERATION: 'system_prompt_generation',
} as const;

const OPENAI_CONFIG = {
  DEFAULT_TEMPERATURE: 0.1,
  DEFAULT_MODEL: 'gpt-4.1-2025-04-14',
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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
} as const;

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Helper function to get default color theme from database
async function getDefaultColorTheme(supabase: any): Promise<any> {
  const { data, error } = await supabase
    .from('color_themes')
    .select('*')
    .eq('is_default', true)
    .eq('is_system', true)
    .single();

  if (error) {
    console.log('No default color theme found, using fallback colors');
    // Return fallback default colors
    return {
      name: 'Professional Blue',
      primary_color: '#2563eb',
      secondary_color: '#0891b2',
      accent_color: '#16a34a',
      text_color: '#64748b',
      background_color: '#f8fafc',
      border_color: '#e5e7eb',
      visual_style: 'Clean, modern professional design',
      color_instructions: 'Use primary colors for main subjects, secondary for supporting elements, accent for highlights'
    };
  }

  return data;
}


serve(async (req) => {
  console.log('invoke-system-prompt-agent function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const requestBody = await req.json();
    const { category, theme, description, sample_posts, user_id } = requestBody;
    
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

    // Allow any category for system prompt generation
    // Categories like 'cdi', 'contracts', 'forms', etc. are allowed
    
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
    
    // Get default color theme to include in prompt generation
    console.log('🎨 FETCHING DEFAULT COLOR THEME: For enhanced prompt generation');
    const defaultColorTheme = await getDefaultColorTheme(supabase);
    console.log('✅ DEFAULT COLORS LOADED:', {
      theme_name: defaultColorTheme.name,
      primary: defaultColorTheme.primary_color,
      secondary: defaultColorTheme.secondary_color,
      accent: defaultColorTheme.accent_color
    });

    console.log('🤖 AI GENERATION MODE: Using OpenAI with default color theme integration');
    
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

    // Use the actual theme as the category for system prompt generation
    const actualCategory = theme || category;
    let userPrompt = `Create a comprehensive system prompt for the "${actualCategory}" category.

Theme: ${actualCategory}
Description: ${description || 'No description provided'}

Default Color Palette to Include:
- Primary: ${defaultColorTheme.primary_color} (${defaultColorTheme.name} theme)
- Secondary: ${defaultColorTheme.secondary_color}
- Accent: ${defaultColorTheme.accent_color}
- Text: ${defaultColorTheme.text_color}
- Background: ${defaultColorTheme.background_color}
- Border: ${defaultColorTheme.border_color}

Visual Style: ${defaultColorTheme.visual_style}
Color Usage: ${defaultColorTheme.color_instructions}

Sample content from this category:
${sample_posts?.map((post: any) => `- ${post.title}: ${post.description}`).join('\n') || 'No sample posts provided'}

Please generate a detailed, professional system prompt following the established template format with industry-specific visual frameworks, the provided color palette, and content analysis guidelines. Include the color palette in the standard format with the exact hex values provided above.`;

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

    // 🔍 ENHANCED LOGGING: Starting database operations
    console.log('📊 DATABASE OPERATIONS: Starting system prompt storage');
    console.log('🎯 TARGET DATA:', {
      user_id,
      agent_id: agent.id,
      agent_name: agent.name,
      category: actualCategory,
      prompt_length: generatedPrompt.length,
      timestamp: new Date().toISOString()
    });

    try {
      // 📝 Step 1: Save the generated prompt to system_prompts table
      console.log('💾 STEP 1: Attempting to insert into system_prompts table');
      const { data: insertedPrompt, error: insertError } = await supabase
        .from('system_prompts')
        .insert({
          user_id,
          agent_id: agent.id,
          agent_name: agent.name,
          agent_purpose: agent.purpose,
          agent_owner: agent.owner,
          name: `${actualCategory} System Prompt`,
          category: actualCategory,
          prompt_text: generatedPrompt,
          description: `Generated system prompt for ${actualCategory} category`
        })
        .select();

      if (insertError) {
        console.error('❌ SYSTEM_PROMPTS INSERT ERROR:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to save system prompt to database: ${insertError.message}`,
          details: insertError
        }), {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ SYSTEM_PROMPTS INSERT SUCCESS:', {
        inserted_records: insertedPrompt?.length || 0,
        first_record_id: insertedPrompt?.[0]?.id,
        category: insertedPrompt?.[0]?.category
      });

    // 🎯 Step 2: Determine target agent based on prompt type
      let targetAgentName = null;
      
      // Route to Visual Prompt Generator for visual content categories
      if (['healthcare', 'contracts', 'design', 'coding ai', 'cdi', 'ai agents', 'product_manager', 'product_designer'].includes(actualCategory) || 
          description?.toLowerCase().includes('visual') || 
          description?.toLowerCase().includes('image') ||
          theme?.toLowerCase().includes('visual')) {
        targetAgentName = AGENT_NAMES.VISUAL_PROMPT_GENERATOR;
      }
      // Route to other agents based on category patterns
      else if (actualCategory.includes('blog') || actualCategory.includes('content')) {
        targetAgentName = AGENT_NAMES.BLOG_CONTENT_GENERATOR;
      }
      else if (actualCategory.includes('cover_letter')) {
        targetAgentName = AGENT_NAMES.COVER_LETTER_GENERATOR;
      }
      else if (actualCategory.includes('calendar') || actualCategory.includes('theme') || actualCategory.includes('json')) {
        targetAgentName = AGENT_NAMES.CALENDAR_THEME_JSON_PROCESSOR;
      }
      else {
        // Default to Visual Prompt Generator for unknown categories
        targetAgentName = AGENT_NAMES.VISUAL_PROMPT_GENERATOR;
      }
      
      if (targetAgentName) {
        console.log(`🔍 STEP 2: Finding target agent "${targetAgentName}" for category "${actualCategory}"`);
        
        const { data: targetAgent, error: targetAgentError } = await supabase
          .from('openai_agents')
          .select('*')
          .eq('name', targetAgentName)
          .eq('user_id', user_id)
          .single();

        if (targetAgentError || !targetAgent) {
          console.error('❌ TARGET AGENT NOT FOUND:', {
            target_agent_name: targetAgentName,
            category: actualCategory,
            error: targetAgentError
          });
        } else {
          console.log('✅ TARGET AGENT FOUND:', {
            agent_name: targetAgent.name,
            agent_id: targetAgent.id,
            category: actualCategory,
            routing_logic: targetAgentName === AGENT_NAMES.VISUAL_PROMPT_GENERATOR ? 'visual_content' : 'other_agent'
          });

          // Add the new prompt to the target agent's system_prompts array
          const existingPrompts = targetAgent.system_prompts || [];
          const newPromptObj = {
            category: actualCategory,
            prompt: generatedPrompt
          };

          // Check if a prompt for this category already exists
          const existingIndex = existingPrompts.findIndex((p: any) => p.category === actualCategory);
          let updatedPrompts;
          
          if (existingIndex >= 0) {
            // Replace existing prompt
            updatedPrompts = [...existingPrompts];
            updatedPrompts[existingIndex] = newPromptObj;
            console.log(`🔄 REPLACING: Existing prompt for category "${actualCategory}" in ${targetAgent.name}`);
          } else {
            // Add new prompt
            updatedPrompts = [...existingPrompts, newPromptObj];
            console.log(`➕ ADDING: New prompt for category "${actualCategory}" to ${targetAgent.name}`);
          }

          // Update target agent's supported categories
          const existingCategories = targetAgent.supported_categories || [];
          const updatedCategories = existingCategories.includes(actualCategory) 
            ? existingCategories 
            : [...existingCategories, actualCategory];

          // Update the target agent with the new prompt
          const currentTimestamp = new Date().toISOString();
          const { error: targetUpdateError } = await supabase
            .from('openai_agents')
            .update({ 
              system_prompts: updatedPrompts,
              supported_categories: updatedCategories,
              last_run: currentTimestamp,
              updated_at: currentTimestamp
            })
            .eq('id', targetAgent.id);

          if (targetUpdateError) {
            console.error('❌ TARGET AGENT UPDATE ERROR:', targetUpdateError);
          } else {
            console.log('✅ TARGET AGENT UPDATED: Successfully added prompt to target agent');
          }

          // Also update the system_prompts table record to reflect the correct target agent
          const { error: promptUpdateError } = await supabase
            .from('system_prompts')
            .update({
              agent_id: targetAgent.id,
              agent_name: targetAgent.name,
              agent_purpose: targetAgent.purpose,
              agent_owner: targetAgent.owner
            })
            .eq('id', insertedPrompt[0].id);

          if (promptUpdateError) {
            console.error('❌ PROMPT RECORD UPDATE ERROR:', promptUpdateError);
          } else {
            console.log('✅ PROMPT RECORD UPDATED: System prompt attribution updated');
          }
        }
      } else {
        console.log(`⚠️  NO TARGET AGENT: Failed to determine target agent for category "${actualCategory}"`);
      }

      // 🔄 Step 3: Update the generator agent's last_run timestamp
      console.log('⏰ STEP 3: Updating generator agent last_run timestamp');
      const currentTimestamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('openai_agents')
        .update({ 
          last_run: currentTimestamp,
          updated_at: currentTimestamp
        })
        .eq('id', agent.id);

      if (updateError) {
        console.error('⚠️  AGENT UPDATE WARNING:', {
          error: updateError,
          message: updateError.message,
          agent_id: agent.id
        });
        // Non-critical error, continue
      } else {
        console.log('✅ AGENT UPDATE SUCCESS: Updated last_run timestamp');
      }

      // 🎉 Final success response
      console.log('🎉 OPERATION COMPLETE: System prompt generated and stored successfully');
      console.log('📈 FINAL STATS:', {
        operation: 'system_prompt_generation',
        user_id,
        category: actualCategory,
        agent_id: agent.id,
        prompt_length: generatedPrompt.length,
        database_records_created: insertedPrompt?.length || 0,
        success: true,
        timestamp: currentTimestamp
      });

      return new Response(JSON.stringify({ 
        success: true, 
        system_prompt: generatedPrompt,
        agent_id: agent.id,
        category: actualCategory,
        database_record_id: insertedPrompt?.[0]?.id,
        message: `System prompt for "${actualCategory}" generated and saved successfully`
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });

    } catch (dbError) {
      console.error('💥 DATABASE OPERATION FAILED:', {
        error: dbError,
        message: dbError.message,
        stack: dbError.stack,
        user_id,
        category: actualCategory,
        agent_id: agent.id
      });

      return new Response(JSON.stringify({ 
        success: false, 
        error: `Database operation failed: ${dbError.message}`,
        category: actualCategory,
        agent_id: agent.id
      }), {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
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