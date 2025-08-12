import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if a system prompt exists for a given theme (with themeId preference and category fallback)
 */
export const useSystemPromptExists = (theme: string | null, category?: string | null, themeId?: string | null) => {
  return useQuery({
    queryKey: ['system-prompt-exists', theme, category, themeId],
    queryFn: async () => {
      // Prefer themeId-based checks if available
      if (themeId) {
        const { data: themeIdData, error: themeIdError } = await supabase
          .from('system_prompts')
          .select('id')
          .eq('theme_id', themeId)
          .limit(1);
        
        if (themeIdError) {
          console.error('Error checking theme_id-based system prompt existence:', themeIdError);
        } else if (themeIdData && themeIdData.length > 0) {
          return true;
        }
      }
      
      // Fallback to theme name/category logic only when themeId is absent
      if (!theme) return false;
      
      // Try to find theme by name to get theme_id, then check for system prompts
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
      
      // Final fallback to text-based theme check
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

      return false;
    },
    enabled: !!themeId || !!theme,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};