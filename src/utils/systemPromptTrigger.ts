import { supabase } from '@/integrations/supabase/client';

/**
 * Manually trigger system prompt generation for categories that have posts but no system prompt
 */
export const triggerSystemPromptGeneration = async (category: string) => {
  console.log('🚀 MANUAL TRIGGER: Starting system prompt generation for category:', category);
  
  try {
    // Check if posts exist for this category
    const { data: existingPosts } = await supabase
      .from('social_media_posts')
      .select('id, title, description')
      .eq('category', category)
      .limit(3);
    
    // Check if a system prompt exists for this category
    const { data: existingSystemPrompts } = await supabase
      .from('system_prompts')
      .select('id')
      .eq('category', category)
      .limit(1);
    
    const hasExistingPosts = existingPosts && existingPosts.length > 0;
    const hasSystemPrompt = existingSystemPrompts && existingSystemPrompts.length > 0;
    
    console.log('📊 CATEGORY STATUS:', {
      category,
      hasExistingPosts,
      postsCount: existingPosts?.length || 0,
      hasSystemPrompt,
      needsGeneration: !hasSystemPrompt
    });
    
    if (!hasExistingPosts) {
      console.log('❌ No posts found for category:', category);
      return { success: false, error: 'No posts found for this category' };
    }
    
    if (hasSystemPrompt) {
      console.log('ℹ️  System prompt already exists for category:', category);
      return { success: false, error: 'System prompt already exists for this category' };
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }
    
    console.log('🤖 CALLING: invoke-system-prompt-agent edge function');
    const { data: invokeData, error: invokeError } = await supabase.functions.invoke('invoke-system-prompt-agent', {
      body: {
        category,
        theme: category,
        description: `Generated content for ${category} category`,
        sample_posts: existingPosts.slice(0, 3),
        user_id: user.id
      }
    });
    
    console.log('📡 EDGE FUNCTION RESPONSE:', { invokeData, invokeError });
    
    if (invokeError) {
      console.error('❌ SYSTEM PROMPT GENERATION ERROR:', invokeError);
      return { success: false, error: invokeError.message };
    } else {
      console.log('✅ SYSTEM PROMPT GENERATED:', invokeData);
      return { success: true, data: invokeData };
    }
    
  } catch (error) {
    console.error('💥 SYSTEM PROMPT GENERATION EXCEPTION:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to trigger for all categories missing system prompts
export const triggerMissingSystemPrompts = async () => {
  console.log('🔍 SEARCHING: Categories with posts but no system prompts');
  
  // Get all categories with posts
  const { data: categories } = await supabase
    .from('social_media_posts')
    .select('category')
    .neq('category', null);
  
  if (!categories) return [];
  
  const uniqueCategories = [...new Set(categories.map(c => c.category))];
  console.log('📂 FOUND CATEGORIES:', uniqueCategories);
  
  const results = [];
  for (const category of uniqueCategories) {
    const result = await triggerSystemPromptGeneration(category);
    results.push({ category, ...result });
  }
  
  return results;
};