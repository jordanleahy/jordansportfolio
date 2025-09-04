import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if a system prompt exists for a given themeId (primary) with theme name fallback
 * ❌ BAD: Phase 2 migration incomplete - still using theme name fallbacks
 */
export const useSystemPromptExists = (themeId: string | null, theme?: string | null, category?: string | null) => {
  return useQuery({
    queryKey: ['system-prompt-exists', themeId, theme, category],
    queryFn: async () => {
      // ✅ GOOD: Primary themeId-based check (Phase 2 migration)
      if (themeId) {
        const { data: themeIdData, error: themeIdError } = await supabase
          .from('theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent' as any)
          .select('id')
          .eq('theme_id', themeId)
          .limit(1);
        
        if (themeIdError) {
          console.error('Error checking theme_id-based system prompt existence:', themeIdError);
          return false;
        }
        
        return (themeIdData && themeIdData.length > 0);
      }
      
      // ❌ BAD: Fallback to theme name/category logic (to be removed in Phase 3)
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
        return false;
      }
      
      // Check for system prompts using theme_id if theme record exists
      if (themeRecord?.id) {
        const { data: themeIdData, error: themeIdError } = await supabase
          .from('theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent' as any)
          .select('id')
          .eq('theme_id', themeRecord.id)
          .limit(1);
        
        if (themeIdError) {
          console.error('Error checking theme_id-based system prompt existence:', themeIdError);
          return false;
        }
        
        return (themeIdData && themeIdData.length > 0);
      }
      
      // ❌ BAD: Final fallback to text-based theme check (legacy)
      const { data: themeData, error: themeTextError } = await supabase
        .from('theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent' as any)
        .select('id')
        .eq('theme', theme)
        .limit(1);
      
      if (themeTextError) {
        console.error('Error checking theme-based system prompt existence:', themeTextError);
        return false;
      }
      
      return (themeData && themeData.length > 0);
    },
    enabled: !!themeId || !!theme,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};