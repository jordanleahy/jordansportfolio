import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportData {
  category: string;
  theme?: string;
  description?: string;
  posts: Array<{
    day?: number;
    title: string;
    description: string;
    theme?: string;
    status?: 'draft' | 'scheduled' | 'published';
  }>;
}

interface ImportResponse {
  success: boolean;
  posts_imported: number;
  system_prompt_generated: boolean;
  category: string;
  errors: string[];
  warnings: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 UNIFIED IMPORT: Starting category import with system prompt generation');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: importData }: { data: ImportData } = await req.json();
    
    if (!importData || !importData.category || !importData.posts || !Array.isArray(importData.posts)) {
      throw new Error('Invalid import data: category and posts array are required');
    }

    console.log(`📦 IMPORT DATA: Category "${importData.category}" with ${importData.posts.length} posts`);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      supabase.auth.setAuth(authHeader.replace('Bearer ', ''));
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response: ImportResponse = {
      success: false,
      posts_imported: 0,
      system_prompt_generated: false,
      category: importData.category,
      errors: [],
      warnings: []
    };

    // Step 1: Check if system prompt already exists for this category
    console.log(`🔍 CHECKING: Existing system prompt for category "${importData.category}"`);
    
    const { data: existingPrompts } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('category', importData.category)
      .eq('user_id', user.id)
      .limit(1);

    const needsSystemPrompt = !existingPrompts || existingPrompts.length === 0;
    console.log(`📋 SYSTEM PROMPT STATUS: ${needsSystemPrompt ? 'Needs generation' : 'Already exists'}`);

    // Step 2: Import posts using existing RPC
    console.log('💾 IMPORTING: Posts to database');
    try {
      const { data: insertCount, error: insertError } = await supabase
        .rpc('insert_category_content', {
          category_name: importData.category,
          posts_data: importData.posts.map(post => ({
            ...post,
            status: post.status || 'draft'
          }))
        });

      if (insertError) {
        throw new Error(`Post import failed: ${insertError.message}`);
      }

      response.posts_imported = insertCount || 0;
      console.log(`✅ POSTS IMPORTED: ${response.posts_imported} posts successfully inserted`);

    } catch (error) {
      console.error('❌ POST IMPORT ERROR:', error);
      response.errors.push(`Failed to import posts: ${error.message}`);
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Generate system prompt if needed
    if (needsSystemPrompt) {
      console.log('🤖 GENERATING: System prompt for new category');
      try {
        const { data: promptData, error: promptError } = await supabase.functions.invoke(
          'invoke-system-prompt-agent',
          {
            body: {
              category: 'system_prompt_generation',
              theme: importData.category,
              description: importData.description || `Generated content for ${importData.category} category`,
              sample_posts: importData.posts.slice(0, 3),
              user_id: user.id
            }
          }
        );

        if (promptError) {
          console.error('❌ SYSTEM PROMPT ERROR:', promptError);
          response.warnings.push(`System prompt generation failed: ${promptError.message}`);
        } else {
          response.system_prompt_generated = true;
          console.log('✅ SYSTEM PROMPT: Generated successfully');
        }

      } catch (error) {
        console.error('💥 SYSTEM PROMPT EXCEPTION:', error);
        response.warnings.push(`System prompt generation exception: ${error.message}`);
      }
    } else {
      console.log('ℹ️ SYSTEM PROMPT: Already exists, skipping generation');
    }

    // Final response
    response.success = true;
    
    console.log('🎉 UNIFIED IMPORT COMPLETE:', {
      category: response.category,
      posts_imported: response.posts_imported,
      system_prompt_generated: response.system_prompt_generated,
      errors_count: response.errors.length,
      warnings_count: response.warnings.length
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 UNIFIED IMPORT ERROR:', error);
    
    const errorResponse: ImportResponse = {
      success: false,
      posts_imported: 0,
      system_prompt_generated: false,
      category: 'unknown',
      errors: [error.message],
      warnings: []
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});