import { supabase } from '@/integrations/supabase/client';

export const manuallyTriggerPromptGeneration = async (themeId: string, category: string, userId: string) => {
  console.log('🔄 Manually triggering prompt generation', { themeId, category, userId });
  
  try {
    const result = await supabase.functions.invoke('ensure-post-image-prompts', {
      body: {
        category,
        userId,
        themeId
      }
    });
    
    if (result.error) {
      console.error('❌ Error triggering prompt generation:', result.error);
      throw new Error(result.error.message);
    }
    
    console.log('✅ Prompt generation triggered successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Failed to trigger prompt generation:', error);
    throw error;
  }
};