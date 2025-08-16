import { useEffect, useState, useMemo, useRef, useReducer } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';

interface ThemeCompletionData {
  id: string;
  prompt_generation_status: 'not_started' | 'in_progress' | 'completed';
  prompt_completion_count: number;
  total_posts_count: number;
  visual_prompt_system_prompt_id: string | null;
}

interface ThemeState {
  themeStatus: ThemeCompletionData | null;
  isInitialLoad: boolean;
}

type ThemeAction = 
  | { type: 'RESET' }
  | { type: 'SET_THEME_DATA'; payload: { data: ThemeCompletionData; wasAlreadyCompleted: boolean } }
  | { type: 'UPDATE_THEME_DATA'; payload: ThemeCompletionData }
  | { type: 'SET_INITIAL_LOAD_COMPLETE' };

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'RESET':
      return { themeStatus: null, isInitialLoad: true };
    case 'SET_THEME_DATA':
      return { themeStatus: action.payload.data, isInitialLoad: false };
    case 'UPDATE_THEME_DATA':
      return { ...state, themeStatus: action.payload };
    case 'SET_INITIAL_LOAD_COMPLETE':
      return { ...state, isInitialLoad: false };
    default:
      return state;
  }
};

export const useThemeCompletionStatus = (themeId: string | undefined, onCompletionRedirect?: () => void) => {
  const [state, dispatch] = useReducer(themeReducer, { themeStatus: null, isInitialLoad: true });
  const { toast } = useToast();
  
  // Use refs to prevent re-renders from toast tracking
  const hasShownCompletionToastRef = useRef(false);
  const hasShownSystemPromptToastRef = useRef(false);
  const initialFetchCacheRef = useRef<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Debounced progress calculation to prevent rapid recalculation
  const debouncedProgressCalc = useDebouncedCallback((themeStatus: ThemeCompletionData | null) => {
    if (!themeStatus) return 0;
    
    const completedCount = themeStatus.prompt_completion_count || 0;
    const totalCount = themeStatus.total_posts_count || 0;
    
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }, 100);

  useEffect(() => {
    if (!themeId) {
      dispatch({ type: 'RESET' });
      hasShownCompletionToastRef.current = false;
      hasShownSystemPromptToastRef.current = false;
      initialFetchCacheRef.current = null;
      return;
    }

    // Skip if we already fetched this theme
    if (initialFetchCacheRef.current === themeId) return;

    // Reset state for new theme
    dispatch({ type: 'RESET' });
    hasShownCompletionToastRef.current = false;
    hasShownSystemPromptToastRef.current = false;
    initialFetchCacheRef.current = themeId;

    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Initial fetch with fresh data
    const fetchThemeStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('id, prompt_generation_status, prompt_completion_count, total_posts_count, visual_prompt_system_prompt_id')
          .eq('id', themeId)
          .single();
        
        if (data) {
          const themeData = data as ThemeCompletionData;
          const wasAlreadyCompleted = data.prompt_generation_status === 'completed';
          
          dispatch({ type: 'SET_THEME_DATA', payload: { data: themeData, wasAlreadyCompleted } });
          
          // Only redirect if theme was already completed when we first fetched it
          if (wasAlreadyCompleted && !hasShownCompletionToastRef.current) {
            hasShownCompletionToastRef.current = true;
            onCompletionRedirect?.();
          }
        } else {
          dispatch({ type: 'SET_INITIAL_LOAD_COMPLETE' });
        }
      } catch (error) {
        dispatch({ type: 'SET_INITIAL_LOAD_COMPLETE' });
      }
    };

    fetchThemeStatus();

    // Set up real-time subscription for theme status changes
    const channel = supabase
      .channel(`theme-completion-${themeId}`)
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
              !hasShownSystemPromptToastRef.current) {
            
            toast({
              title: "System Prompt Ready! 🚀",
              description: "Theme system prompt generated. Starting individual image prompt generation...",
              duration: 4000,
            });
            
            hasShownSystemPromptToastRef.current = true;
          }
          
          // Check if theme just completed and we haven't shown toast yet
          if (newData.prompt_generation_status === 'completed' && 
              !hasShownCompletionToastRef.current && 
              state.themeStatus?.prompt_generation_status !== 'completed') {
            
            // Clear themes cache to refresh the UI immediately when theme status changes
            import('@/services/optimizedSocialMediaService').then(({ optimizedSocialMediaService }) => {
              optimizedSocialMediaService.clearThemesCache();
            });
            
            toast({
              title: "Theme Created! 🎉",
              description: `All ${newData.total_posts_count} individual image prompts have been generated successfully.`,
              duration: 5000,
            });
            
            hasShownCompletionToastRef.current = true;
            
            // Redirect to the theme page when completed
            onCompletionRedirect?.();
          }
          
          dispatch({ type: 'UPDATE_THEME_DATA', payload: newData });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [themeId, toast, onCompletionRedirect]);

  // Calculate completion progress with debouncing
  const completionProgress = useMemo(() => {
    return debouncedProgressCalc(state.themeStatus);
  }, [state.themeStatus, debouncedProgressCalc]);

  // Default to false for new themes or when data is still loading
  const isCompleted = !state.isInitialLoad && state.themeStatus?.prompt_generation_status === 'completed';

  return {
    themeStatus: state.themeStatus,
    isCompleted,
    hasSystemPrompt: !!state.themeStatus?.visual_prompt_system_prompt_id,
    completionProgress
  };
};