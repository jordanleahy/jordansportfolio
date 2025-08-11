import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if a system prompt exists for a given theme (with category fallback)
 */
export const useSystemPromptExists = (theme: string | null, category?: string | null) => {
  return useQuery({
    queryKey: ['system-prompt-exists', theme, category],
    queryFn: async () => {
      if (!theme) return false;
      
      // First try to find theme by name to get theme_id, then check for system prompts
      const { data: themeRecord, error: themeError } = await supabase
        .from('themes')
        .select('id')
        .eq('theme_name', theme)
        .eq('category', category || 'general')
        .limit(1)
        .maybeSingle();
      
      if (themeError) {
        console.error('Error finding theme record:', themeError);
      }
      
      // Check for system prompts using theme_id if theme record exists
      if (themeRecord?.id) {
        const { data: themeIdData, error: themeIdError } = await supabase
          .from('system_prompts')
          .select('id')
          .eq('theme_id', themeRecord.id)
          .limit(1);
        
        if (themeIdError) {
          console.error('Error checking theme_id-based system prompt existence:', themeIdError);
        }
        
        if (themeIdData && themeIdData.length > 0) {
          return true;
        }
      }
      
      // Fallback to text-based theme check
      const { data: themeData, error: themeTextError } = await supabase
        .from('system_prompts')
        .select('id')
        .eq('theme', theme)
        .limit(1);
      
      if (themeTextError) {
        console.error('Error checking theme-based system prompt existence:', themeTextError);
      }
      
      if (themeData && themeData.length > 0) {
        return true;
      }
      
      // Final fallback to category-only check
      if (category) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('system_prompts')
          .select('id')
          .eq('category', category)
          .is('theme', null)
          .limit(1);
        
        if (categoryError) {
          console.error('Error checking category fallback system prompt existence:', categoryError);
          return false;
        }
        
        return categoryData && categoryData.length > 0;
      }
      
      return false;
    },
    enabled: !!theme,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};