import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ThemeCompletionData {
  id: string;
  prompt_generation_status: 'not_started' | 'in_progress' | 'completed';
  prompt_completion_count: number;
  total_posts_count: number;
}

export const useThemeCompletionStatus = (themeId: string | undefined) => {
  const [themeStatus, setThemeStatus] = useState<ThemeCompletionData | null>(null);
  const [hasShownCompletionToast, setHasShownCompletionToast] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!themeId) return;

    // Initial fetch
    const fetchThemeStatus = async () => {
      const { data } = await supabase
        .from('themes')
        .select('id, prompt_generation_status, prompt_completion_count, total_posts_count')
        .eq('id', themeId)
        .single();
      
        if (data) {
          setThemeStatus(data as ThemeCompletionData);
        }
    };

    fetchThemeStatus();

    // Set up real-time subscription for theme status changes
    const channel = supabase
      .channel('theme-completion-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'themes',
          filter: `id=eq.${themeId}`
        },
        (payload) => {
          const newData = payload.new as ThemeCompletionData;
          
          // Check if theme just completed and we haven't shown toast yet
          if (newData.prompt_generation_status === 'completed' && 
              !hasShownCompletionToast && 
              themeStatus?.prompt_generation_status !== 'completed') {
            
            toast({
              title: "Theme Created! 🎉",
              description: `All ${newData.total_posts_count} individual image prompts have been generated successfully.`,
              duration: 5000,
            });
            
            setHasShownCompletionToast(true);
          }
          
          setThemeStatus(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [themeId, hasShownCompletionToast, themeStatus?.prompt_generation_status, toast]);

  return {
    themeStatus,
    isCompleted: themeStatus?.prompt_generation_status === 'completed',
    completionProgress: themeStatus 
      ? Math.round((themeStatus.prompt_completion_count / themeStatus.total_posts_count) * 100) 
      : 0
  };
};