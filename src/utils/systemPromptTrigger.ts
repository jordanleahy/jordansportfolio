import { supabase } from '@/integrations/supabase/client';

/**
 * ❌ BAD: Phase 2 migration incomplete - still using category names
 * TODO: Update to use themeId-based system prompt generation
 */
export const triggerSystemPromptGeneration = async (category: string) => {
  console.log('🚀 MANUAL TRIGGER: Starting system prompt generation for category:', category);
  console.log('🕐 TRIGGER TIMESTAMP:', new Date().toISOString());
  
  try {
    console.log('🔍 STEP 1: Checking existing posts for category');
    // ❌ BAD: Theme name lookup (Phase 2 migration needed)
    const { data: theme } = await supabase
      .from('themes')
      .select('id')
      .eq('theme_name', category)
      .single();
    
    if (!theme) {
      console.log('❌ No theme found for category:', category);
      return { success: false, error: 'No theme found for this category' };
    }
    
    // ✅ GOOD: Using theme_id for posts query
    const postsQuery = supabase
      .from('social_media_posts')
      .select('id, title, description')
      .eq('theme_id', theme.id)
      .limit(3);
    const { data: existingPosts, error: postsError } = await postsQuery;
    
    console.log('📊 POSTS QUERY RESULT:', {
      postsFound: existingPosts?.length || 0,
      postsError: postsError?.message,
      firstPostTitle: existingPosts?.[0]?.title
    });
    
    console.log('🔍 STEP 2: Checking existing system prompts for category');
    // ❌ BAD: Legacy theme field check (Phase 2 migration needed)
    const promptsQuery = supabase
      .from('theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent' as any)
      .select('id')
      .eq('theme', category)
      .limit(1);
    const { data: existingSystemPrompts, error: promptsError } = await promptsQuery;
    
    console.log('📊 SYSTEM PROMPTS QUERY RESULT:', {
      promptsFound: existingSystemPrompts?.length || 0,
      promptsError: promptsError?.message
    });
    
    const hasExistingPosts = existingPosts && existingPosts.length > 0;
    const hasSystemPrompt = existingSystemPrompts && existingSystemPrompts.length > 0;
    
    console.log('📊 CATEGORY STATUS SUMMARY:', {
      category,
      hasExistingPosts,
      postsCount: existingPosts?.length || 0,
      hasSystemPrompt,
      needsGeneration: hasExistingPosts && !hasSystemPrompt,
      timestamp: new Date().toISOString()
    });
    
    if (!hasExistingPosts) {
      console.log('❌ No posts found for category:', category);
      return { success: false, error: 'No posts found for this category' };
    }
    
    if (hasSystemPrompt) {
      console.log('ℹ️  System prompt already exists for category:', category);
      return { success: false, error: 'System prompt already exists for this category' };
    }
    
    console.log('🔍 STEP 3: Getting current authenticated user');
    // Get current user
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
    
    console.log('🚀 STEP 4: Calling create-theme-system-prompt edge function');
    console.log('📋 EDGE FUNCTION PAYLOAD:', {
      category: 'system_prompt_generation',
      theme: category,
      description: `Generated content for ${category} category`,
      sample_posts_count: existingPosts?.slice(0, 3).length || 0,
      user_id: user.id
    });
    
    const { data: invokeData, error: invokeError } = await supabase.functions.invoke('create-theme-system-prompt', {
      body: {
        category: 'system_prompt_generation',
        theme: category,
        description: `Generated content for ${category} category`,
        sample_posts: existingPosts?.slice(0, 3) || [],
        user_id: user.id
      }
    });
    
    console.log('📡 EDGE FUNCTION COMPLETE:', {
      hasData: !!invokeData,
      hasError: !!invokeError,
      errorMessage: invokeError?.message,
      successData: invokeData?.success
    });
    
    if (invokeError) {
      console.error('❌ SYSTEM PROMPT GENERATION ERROR:', invokeError);
      return { success: false, error: invokeError.message };
    } else {
      console.log('✅ SYSTEM PROMPT GENERATED:', invokeData);
      return { success: true, data: invokeData };
    }
    
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
      console.log(`⚠️ No posts found for category ${category}, skipping system prompt generation`);
      return { success: false, error: 'No posts available for system prompt generation' };
    }

    console.log(`📝 Found ${posts.length} posts for category ${category}, generating system prompt...`);

    // Call the system prompt agent
    const { data, error } = await supabase.functions.invoke('create-theme-system-prompt', {
      body: {
        category: 'system_prompt_generation',
        theme: themeName,
        theme_id: themeId,
        description: `Generated system prompt for ${category} category`,
        sample_posts: posts.slice(0, 5), // Limit to 5 sample posts
        user_id: user.id
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

// Helper function to trigger for all categories missing system prompts
export const triggerMissingSystemPrompts = async () => {
  console.log('🔍 SEARCHING: Categories with posts but no system prompts');
  
  // Get all themes that have posts but no system prompts
  const themesQuery = supabase
    .from('themes')
    .select('theme_name, id')
    .is('visual_prompt_system_prompt_id', null);
  const { data: themes } = await themesQuery;
  
  if (!themes) return [];
  
  const uniqueCategories = themes.map((t: any) => t.theme_name);
  console.log('📂 FOUND CATEGORIES:', uniqueCategories);
  
  const results = [];
  for (const category of uniqueCategories) {
    const result = await triggerSystemPromptGeneration(category);
    results.push({ category, ...result });
  }
  
  return results;
};