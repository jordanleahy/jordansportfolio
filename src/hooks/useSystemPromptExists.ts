import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if a system prompt exists for a given category
 */
export const useSystemPromptExists = (category: string | null) => {
  return useQuery({
    queryKey: ['system-prompt-exists', category],
    queryFn: async () => {
      if (!category) return false;
      
      const { data, error } = await supabase
        .from('system_prompts')
        .select('id')
        .eq('category', category)
        .limit(1);
      
      if (error) {
        console.error('Error checking system prompt existence:', error);
        return false;
      }
      
      return data && data.length > 0;
    },
    enabled: !!category,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};