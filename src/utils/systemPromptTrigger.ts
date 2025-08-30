import { supabase } from '@/integrations/supabase/client';

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
    const { data, error } = await supabase.functions.invoke('invoke-system-prompt-agent', {
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
