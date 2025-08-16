import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleThemeCompletion {
  isProcessing: boolean;
  isCompleted: boolean;
}

/**
 * Simple hook to track theme completion status with binary state only
 * No real-time updates, no toasts, no complex state management
 * Just polls until theme is fully completed (100% processed)
 */
export const useSimpleThemeCompletion = (
  themeId: string | undefined,
  onComplete?: () => void
): SimpleThemeCompletion => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (!themeId || hasCompletedRef.current) {
      return;
    }

    const checkCompletion = async () => {
      try {
        const { data, error } = await supabase
          .from('themes')
          .select('prompt_generation_status, prompt_completion_count, total_posts_count')
          .eq('id', themeId)
          .maybeSingle();

        if (error || !data) {
          console.error('Error checking theme completion:', error);
          return;
        }

        const isFullyComplete = 
          data.prompt_generation_status === 'completed' &&
          data.prompt_completion_count === data.total_posts_count;

        if (isFullyComplete && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setIsProcessing(false);
          setIsCompleted(true);
          
          // Clear polling interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Notify completion
          onComplete?.();
        } else if (!isFullyComplete) {
          setIsProcessing(true);
          setIsCompleted(false);
        }
      } catch (error) {
        console.error('Error in theme completion check:', error);
      }
    };

    // Initial check
    checkCompletion();

    // Start polling if not completed
    if (!hasCompletedRef.current) {
      setIsProcessing(true);
      intervalRef.current = setInterval(checkCompletion, 3000); // Poll every 3 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [themeId, onComplete]);

  // Reset when themeId changes
  useEffect(() => {
    hasCompletedRef.current = false;
    setIsProcessing(false);
    setIsCompleted(false);
  }, [themeId]);

  return {
    isProcessing,
    isCompleted
  };
};