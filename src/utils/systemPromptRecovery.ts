import { supabase } from '@/integrations/supabase/client';
import { triggerSystemPromptGeneration } from './systemPromptTrigger';

/**
 * Recovery utility for themes missing system prompts
 */

export interface SystemPromptRecoveryResult {
  success: boolean;
  themeId: string;
  themeName: string;
  category: string;
  error?: string;
}

export interface RecoveryStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: SystemPromptRecoveryResult[];
}

/**
 * Find themes that are missing system prompts but have posts
 */
export const findThemesNeedingSystemPrompts = async (userId?: string) => {
  console.log('🔍 Finding themes that need system prompts...');
  
  let query = supabase
    .from('themes')
    .select(`
      id,
      theme_name,
      category,
      user_id,
      prompt_generation_status,
      visual_prompt_system_prompt_id,
      created_at
    `)
    .or('visual_prompt_system_prompt_id.is.null,prompt_generation_status.eq.failed')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: themes, error } = await query;
  
  if (error) {
    console.error('❌ Error finding themes:', error);
    throw new Error(`Failed to find themes: ${error.message}`);
  }

  // Filter themes that have posts
  const themesWithPosts = [];
  for (const theme of themes || []) {
    const { count } = await supabase
      .from('social_media_posts')
      .select('id', { count: 'exact' })
      .eq('theme_id', theme.id);
    
    if (count && count > 0) {
      themesWithPosts.push(theme);
    }
  }

  console.log(`📊 Found ${themesWithPosts.length} themes needing system prompts`);
  return themesWithPosts;
};

/**
 * Retry system prompt generation for a specific theme
 */
export const retrySystemPromptForTheme = async (themeId: string): Promise<SystemPromptRecoveryResult> => {
  console.log(`🔄 Retrying system prompt generation for theme: ${themeId}`);
  
  try {
    // Get theme details
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .select('id, theme_name, category, user_id, prompt_generation_status')
      .eq('id', themeId)
      .single();

    if (themeError || !theme) {
      const error = `Theme not found: ${themeError?.message || 'Unknown error'}`;
      console.error('❌', error);
      return {
        success: false,
        themeId,
        themeName: 'Unknown',
        category: 'Unknown',
        error
      };
    }

    // Update status to indicate retry attempt
    await supabase
      .from('themes')
      .update({ 
        prompt_generation_status: 'generating',
        updated_at: new Date().toISOString()
      })
      .eq('id', themeId);

    // Trigger system prompt generation
    const result = await triggerSystemPromptGeneration(theme.category);
    
    if (result.success) {
      console.log('✅ System prompt retry successful for theme:', theme.theme_name);
      return {
        success: true,
        themeId: theme.id,
        themeName: theme.theme_name,
        category: theme.category
      };
    } else {
      console.error('❌ System prompt retry failed for theme:', theme.theme_name, result.error);
      // Update status back to failed
      await supabase
        .from('themes')
        .update({ 
          prompt_generation_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', themeId);
      
      return {
        success: false,
        themeId: theme.id,
        themeName: theme.theme_name,
        category: theme.category,
        error: result.error || 'Unknown error'
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ System prompt retry crashed for theme:', themeId, errorMessage);
    
    // Update status to failed
    try {
      await supabase
        .from('themes')
        .update({ 
          prompt_generation_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', themeId);
    } catch (updateError) {
      console.error('❌ Failed to update theme status:', updateError);
    }

    return {
      success: false,
      themeId,
      themeName: 'Unknown',
      category: 'Unknown',
      error: errorMessage
    };
  }
};

/**
 * Batch recovery for all themes missing system prompts
 */
export const recoverAllMissingSystemPrompts = async (userId?: string): Promise<RecoveryStats> => {
  console.log('🚀 Starting batch system prompt recovery...');
  
  try {
    const themes = await findThemesNeedingSystemPrompts(userId);
    const results: SystemPromptRecoveryResult[] = [];
    
    if (themes.length === 0) {
      console.log('✅ No themes need system prompt recovery');
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        results: []
      };
    }

    console.log(`🔄 Processing ${themes.length} themes...`);
    
    // Process themes in batches to avoid overwhelming the system
    const BATCH_SIZE = 3;
    const BATCH_DELAY = 2000; // 2 seconds between batches
    
    for (let i = 0; i < themes.length; i += BATCH_SIZE) {
      const batch = themes.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(themes.length / BATCH_SIZE)}`);
      
      const batchPromises = batch.map(theme => retrySystemPromptForTheme(theme.id));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Delay between batches (except for the last batch)
      if (i + BATCH_SIZE < themes.length) {
        console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('📊 Recovery Summary:');
    console.log(`   - Total processed: ${results.length}`);
    console.log(`   - Successful: ${successful}`);
    console.log(`   - Failed: ${failed}`);
    
    return {
      totalProcessed: results.length,
      successful,
      failed,
      results
    };

  } catch (error) {
    console.error('💥 Batch recovery process failed:', error);
    throw error;
  }
};

/**
 * Check system prompt health for all themes
 */
export const checkSystemPromptHealth = async (userId?: string) => {
  console.log('🩺 Checking system prompt health...');
  
  let query = supabase
    .from('themes')
    .select(`
      id,
      theme_name,
      category,
      prompt_generation_status,
      visual_prompt_system_prompt_id,
      lifecycle_status,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: themes, error } = await query;
  
  if (error) {
    throw new Error(`Failed to check system prompt health: ${error.message}`);
  }

  const stats = {
    total: themes?.length || 0,
    completed: 0,
    generating: 0,
    failed: 0,
    notStarted: 0,
    withSystemPrompt: 0,
    missingSystemPrompt: 0
  };

  themes?.forEach(theme => {
    // Count by generation status
    switch (theme.prompt_generation_status) {
      case 'completed':
        stats.completed++;
        break;
      case 'generating':
        stats.generating++;
        break;
      case 'failed':
        stats.failed++;
        break;
      case 'not_started':
      default:
        stats.notStarted++;
        break;
    }
    
    // Count by system prompt presence
    if (theme.visual_prompt_system_prompt_id) {
      stats.withSystemPrompt++;
    } else {
      stats.missingSystemPrompt++;
    }
  });

  console.log('📊 System Prompt Health Stats:', stats);
  return { stats, themes };
};