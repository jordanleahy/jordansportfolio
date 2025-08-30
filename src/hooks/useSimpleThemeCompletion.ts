import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SimpleThemeCompletion {
  isProcessing: boolean;
  isCompleted: boolean;
}

/**
 * Hook to track when ALL image prompts for a theme are completed
 * Shows success notification only when every single post has its image prompt generated
 * This is what actually matters - not when theme is initially created
 */
export const useSimpleThemeCompletion = (
  themeId: string | undefined,
  onComplete?: () => void
): SimpleThemeCompletion => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!themeId || hasCompletedRef.current) {
      return;
    }

    const checkCompletion = async () => {
      try {
        // Get actual posts data instead of unreliable database counters
        const { data: posts, error: postsError } = await supabase
          .from('social_media_posts')
          .select('individual_prompt_status')
          .eq('theme_id', themeId);

        if (postsError) {
          console.error('Error checking theme posts:', postsError);
          return;
        }

        if (!posts || posts.length === 0) {
          return; // No posts yet, keep waiting
        }

        const completedPosts = posts.filter(p => p.individual_prompt_status === 'completed').length;
        const isFullyComplete = completedPosts === posts.length;

        if (isFullyComplete && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setIsProcessing(false);
          setIsCompleted(true);
          
          // Clear polling interval
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Theme completion detected - no toast shown
          
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