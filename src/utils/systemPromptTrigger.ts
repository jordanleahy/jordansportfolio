import { supabase } from '@/integrations/supabase/client';

/**
 * Manually trigger system prompt generation for categories that have posts but no system prompt
 */
export const triggerSystemPromptGeneration = async (category: string) => {
  console.log('🚀 MANUAL TRIGGER: Starting system prompt generation for category:', category);
  console.log('🕐 TRIGGER TIMESTAMP:', new Date().toISOString());
  
  try {
    console.log('🔍 STEP 1: Checking existing posts for category');
    // Check if posts exist for this category
    const postsQuery = supabase
      .from('social_media_posts')
      .select('id, title, description')
      .eq('category', category)
      .limit(3);
    const { data: existingPosts, error: postsError } = await postsQuery;
    
    console.log('📊 POSTS QUERY RESULT:', {
      postsFound: existingPosts?.length || 0,
      postsError: postsError?.message,
      firstPostTitle: existingPosts?.[0]?.title
    });
    
    console.log('🔍 STEP 2: Checking existing system prompts for category');
    // Check if a system prompt exists for this category - using theme field instead
    const promptsQuery = supabase
      .from('system_prompts')
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
    
    console.log('🚀 STEP 4: Calling invoke-system-prompt-agent edge function');
    console.log('📋 EDGE FUNCTION PAYLOAD:', {
      category: 'system_prompt_generation',
      theme: category,
      description: `Generated content for ${category} category`,
      sample_posts_count: existingPosts?.slice(0, 3).length || 0,
      user_id: user.id
    });
    
    const { data: invokeData, error: invokeError } = await supabase.functions.invoke('invoke-system-prompt-agent', {
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

// Helper function to trigger for all categories missing system prompts
export const triggerMissingSystemPrompts = async () => {
  console.log('🔍 SEARCHING: Categories with posts but no system prompts');
  
  // Get all categories with posts
  const categoriesQuery = supabase
    .from('social_media_posts')
    .select('category')
    .neq('category', null);
  const { data: categories } = await categoriesQuery;
  
  if (!categories) return [];
  
  const uniqueCategories = [...new Set(categories.map((c: any) => c.category))];
  console.log('📂 FOUND CATEGORIES:', uniqueCategories);
  
  const results = [];
  for (const category of uniqueCategories) {
    const result = await triggerSystemPromptGeneration(category);
    results.push({ category, ...result });
  }
  
  return results;
};