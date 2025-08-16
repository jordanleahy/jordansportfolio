import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ThemeCompletionData {
  id: string;
  prompt_generation_status: 'not_started' | 'in_progress' | 'completed';
  prompt_completion_count: number;
  total_posts_count: number;
  visual_prompt_system_prompt_id: string | null;
}

export const useThemeCompletionStatus = (themeId: string | undefined, onCompletionRedirect?: () => void) => {
  const [themeStatus, setThemeStatus] = useState<ThemeCompletionData | null>(null);
  const [hasShownCompletionToast, setHasShownCompletionToast] = useState(false);
  const [hasShownSystemPromptToast, setHasShownSystemPromptToast] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();

  // Debug logging
  console.log('useThemeCompletionStatus - themeId:', themeId);
  console.log('useThemeCompletionStatus - themeStatus:', themeStatus);
  console.log('useThemeCompletionStatus - isInitialLoad:', isInitialLoad);

  useEffect(() => {
    if (!themeId) {
      setIsInitialLoad(true);
      return;
    }

    // Reset state for new theme
    setThemeStatus(null);
    setIsInitialLoad(true);
    setHasShownCompletionToast(false);
    setHasShownSystemPromptToast(false);

    // Initial fetch with fresh data
    const fetchThemeStatus = async () => {
      console.log('Fetching fresh theme status for themeId:', themeId);
      
      const { data, error } = await supabase
        .from('themes')
        .select('id, prompt_generation_status, prompt_completion_count, total_posts_count, visual_prompt_system_prompt_id')
        .eq('id', themeId)
        .single();
      
      console.log('Theme status fetch result:', { data, error });
      
      if (data) {
        const themeData = data as ThemeCompletionData;
        console.log('Setting fresh theme status:', themeData);
        setThemeStatus(themeData);
        setIsInitialLoad(false);
        
        // Only redirect if theme was already completed AND we're on initial load from a completion redirect
        // This prevents immediate redirect when navigating to a processing theme
        if (data.prompt_generation_status === 'completed' && !hasShownCompletionToast && !isInitialLoad) {
          console.log('Theme already completed, triggering redirect');
          setHasShownCompletionToast(true);
          onCompletionRedirect?.();
        }
      } else if (error) {
        console.log('No theme data found or error, assuming new theme');
        setIsInitialLoad(false);
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
          const oldData = payload.old as ThemeCompletionData;
          
          // Check if system prompt was just completed 
          if (newData.visual_prompt_system_prompt_id && 
              !oldData.visual_prompt_system_prompt_id && 
              !hasShownSystemPromptToast) {
            
            toast({
              title: "System Prompt Ready! 🚀",
              description: "Theme system prompt generated. Starting individual image prompt generation...",
              duration: 4000,
            });
            
            setHasShownSystemPromptToast(true);
          }
          
          // Check if theme just completed and we haven't shown toast yet
          if (newData.prompt_generation_status === 'completed' && 
              !hasShownCompletionToast && 
              themeStatus?.prompt_generation_status !== 'completed') {
            
            
            
            // Clear themes cache to refresh the UI immediately when theme status changes
            import('@/services/optimizedSocialMediaService').then(({ optimizedSocialMediaService }) => {
              optimizedSocialMediaService.clearThemesCache();
            });
            
            // toast({
            //   title: "Theme Created! 🎉",
            //   description: `All ${newData.total_posts_count} individual image prompts have been generated successfully.`,
            //   duration: 5000,
            // });
            
            setHasShownCompletionToast(true);
            
            // Redirect to the theme page when completed
            onCompletionRedirect?.();
          }
          
          setThemeStatus(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [themeId, hasShownCompletionToast, hasShownSystemPromptToast, themeStatus?.prompt_generation_status, toast, onCompletionRedirect]);

  // Calculate completion progress with proper null handling
  const completionProgress = useMemo(() => {
    if (!themeStatus) return 0;
    
    const completedCount = themeStatus.prompt_completion_count || 0;
    const totalCount = themeStatus.total_posts_count || 0;
    
    console.log('Progress calculation:', { completedCount, totalCount });
    
    if (totalCount === 0) return 0;
    
    const progress = Math.round((completedCount / totalCount) * 100);
    console.log('Calculated progress:', progress);
    
    return progress;
  }, [themeStatus]);

  // Default to false for new themes or when data is still loading
  const isCompleted = !isInitialLoad && themeStatus?.prompt_generation_status === 'completed';
  console.log('Is completed?', isCompleted, 'Status:', themeStatus?.prompt_generation_status, 'Initial load:', isInitialLoad);

  return {
    themeStatus,
    isCompleted,
    hasSystemPrompt: !!themeStatus?.visual_prompt_system_prompt_id,
    completionProgress
  };
};