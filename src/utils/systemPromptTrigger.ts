import { supabase } from '@/integrations/supabase/client';

/**
 * ✅ FIXED: Trigger system prompt generation for a specific themeId
 * Migrated from category-based to themeId-based approach
 */
export const triggerSystemPromptGeneration = async (themeId: string) => {
  console.log('🚀 MANUAL TRIGGER: Starting system prompt generation for themeId:', themeId);
  console.log('🕐 TRIGGER TIMESTAMP:', new Date().toISOString());
  
  try {
    console.log('🔍 STEP 1: Validating theme exists');
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .select('id, theme_name, category')
      .eq('id', themeId)
      .single();
    
    if (themeError || !theme) {
      console.log('❌ No theme found for themeId:', themeId);
      return { success: false, error: 'No theme found for this themeId' };
    }
    
    console.log('✅ Found theme:', theme.theme_name, 'in category:', theme.category);
    
    // ✅ GOOD: Using theme_id for posts query
    const { data: existingPosts, error: postsError } = await supabase
      .from('social_media_posts')
      .select('id, title, description')
      .eq('theme_id', themeId)
      .limit(3);
    
    console.log('📊 POSTS QUERY RESULT:', {
      postsFound: existingPosts?.length || 0,
      postsError: postsError?.message,
      firstPostTitle: existingPosts?.[0]?.title
    });
    
    console.log('🔍 STEP 2: Checking existing system prompts for theme');
    // ✅ GOOD: Using theme_id for system prompts check
    const { data: existingSystemPrompts, error: promptsError } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('theme_id', themeId)
      .limit(1);
    
    console.log('📊 SYSTEM PROMPTS QUERY RESULT:', {
      promptsFound: existingSystemPrompts?.length || 0,
      promptsError: promptsError?.message
    });
    
    const hasExistingPosts = existingPosts && existingPosts.length > 0;
    const hasSystemPrompt = existingSystemPrompts && existingSystemPrompts.length > 0;
    
    console.log('📊 THEME STATUS SUMMARY:', {
      themeId,
      themeName: theme.theme_name,
      category: theme.category,
      hasExistingPosts,
      postsCount: existingPosts?.length || 0,
      hasSystemPrompt,
      needsGeneration: hasExistingPosts && !hasSystemPrompt,
      timestamp: new Date().toISOString()
    });
    
    if (!hasExistingPosts) {
      console.log('❌ No posts found for themeId:', themeId);
      return { success: false, error: 'No posts found for this theme' };
    }
    
    if (hasSystemPrompt) {
      console.log('ℹ️  System prompt already exists for themeId:', themeId);
      return { success: false, error: 'System prompt already exists for this theme' };
    }
    
    console.log('🔍 STEP 3: Getting current authenticated user');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 USER AUTH RESULT:', {
      userFound: !!user,
      userId: user?.id,
      userError: userError?.message
    });
    
    if (!user) {
      console.log('❌ User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }
    
    // Call the system prompt generator with themeId
    console.log('📡 STEP 4: Calling system prompt generation service');
    const { data, error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
      body: {
        theme_id: themeId,
        user_id: user.id,
        posts: existingPosts.slice(0, 3)
      }
    });

    if (error) {
      console.error('❌ SYSTEM PROMPT GENERATION ERROR:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ SYSTEM PROMPT GENERATION SUCCESS:', data);
    console.log('🏁 TRIGGER COMPLETED:', new Date().toISOString());
    return { success: true, data };

  } catch (error: any) {
    console.error('💥 SYSTEM PROMPT GENERATION EXCEPTION:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger system prompt generation for a newly created theme
 */
export const triggerSystemPromptForNewTheme = async (themeId: string, themeName: string, category: string) => {
  console.log(`🔄 Starting system prompt generation for new theme: ${themeName} (${category})`);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if theme already has a system prompt
    const { data: existingTheme } = await supabase
      .from('themes')
      .select('visual_prompt_system_prompt_id')
      .eq('id', themeId)
      .single();

    if (existingTheme?.visual_prompt_system_prompt_id) {
      console.log(`✅ Theme ${themeId} already has a system prompt, skipping generation`);
      return { success: true, message: 'System prompt already exists' };
    }

    // Check if posts exist for this theme
    const { data: posts } = await supabase
      .from('social_media_posts')
      .select('id, title, description')
      .eq('theme_id', themeId)
      .eq('user_id', user.id)
      .limit(10);

    if (!posts || posts.length === 0) {
      console.log(`⚠️ No posts found for theme ${themeId}, skipping system prompt generation`);
      return { success: false, error: 'No posts available for system prompt generation' };
    }

    console.log(`📝 Found ${posts.length} posts for theme ${themeName}, generating system prompt...`);

    // Call the system prompt agent
    const { data, error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
      body: {
        theme_id: themeId,
        user_id: user.id,
        posts: posts.slice(0, 5) // Limit to 5 sample posts
      }
    });

    if (error) {
      console.error(`❌ Error generating system prompt for theme ${themeId}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`✅ System prompt generated successfully for theme: ${themeName}`);
    return { success: true, data };

  } catch (error) {
    console.error(`💥 System prompt generation failed for theme ${themeId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * ✅ FIXED: Find themes missing system prompts and trigger generation
 * Updated to use themeId-based approach
 */
export const triggerMissingSystemPrompts = async () => {
  console.log('🔍 SEARCHING FOR THEMES WITHOUT SYSTEM PROMPTS');
  
  const { data: themes } = await supabase
    .from('themes')
    .select('id, theme_name, category')
    .is('visual_prompt_system_prompt_id', null);
  
  if (!themes) return [];
  
  console.log('📂 FOUND THEMES WITHOUT SYSTEM PROMPTS:', themes.length);
  
  const results = [];
  for (const theme of themes) {
    console.log(`🔄 Processing theme: ${theme.theme_name} (${theme.category})`);
    const result = await triggerSystemPromptGeneration(theme.id);
    results.push({ 
      themeId: theme.id, 
      themeName: theme.theme_name, 
      category: theme.category, 
      ...result 
    });
  }
  
  return results;
};