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
      
      // First check for theme-based prompt
      const { data: themeData, error: themeError } = await supabase
        .from('system_prompts')
        .select('id')
        .eq('theme', theme)
        .limit(1);
      
      if (themeError) {
        console.error('Error checking theme-based system prompt existence:', themeError);
      }
      
      if (themeData && themeData.length > 0) {
        return true;
      }
      
      // Fallback to category-only check if theme not found
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