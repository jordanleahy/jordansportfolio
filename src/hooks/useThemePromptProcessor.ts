import { useState, useCallback } from 'react';
import { useOptimizedPromptGeneration } from './useOptimizedPromptGeneration';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ThemeProcessingStatus {
  themeId: string;
  totalPosts: number;
  completed: number;
  inProgress: number;
  failed: number;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

export const useThemePromptProcessor = () => {
  const [processingStatuses, setProcessingStatuses] = useState<Map<string, ThemeProcessingStatus>>(new Map());
  const { generateBatch } = useOptimizedPromptGeneration();
  const { toast } = useToast();

  const updateStatus = useCallback((themeId: string, updates: Partial<ThemeProcessingStatus>) => {
    setProcessingStatuses(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(themeId) || {
        themeId,
        totalPosts: 0,
        completed: 0,
        inProgress: 0,
        failed: 0,
        status: 'idle' as const
      };
      newMap.set(themeId, { ...current, ...updates });
      return newMap;
    });
  }, []);

  const processThemePrompts = useCallback(async (
    themeId: string,
    options: {
      aspectRatio?: string;
      forceRegenerate?: boolean;
      batchSize?: number;
    } = {}
  ) => {
    const { aspectRatio = '1:1', forceRegenerate = false, batchSize = 10 } = options;

    try {
      // Get all posts for this theme
      const { data: posts, error } = await supabase
        .from('social_media_posts')
        .select('id, title, description, generated_image_prompt, individual_prompt_status')
        .eq('theme_id', themeId)
        .order('day', { ascending: true });

      if (error) throw error;
      if (!posts?.length) {
        throw new Error('No posts found for this theme');
      }

      // Filter posts that need processing
      const postsToProcess = posts.filter(post => 
        forceRegenerate || 
        !post.generated_image_prompt || 
        post.individual_prompt_status !== 'completed'
      );

      if (postsToProcess.length === 0) {
        toast({
          title: "All prompts ready",
          description: "All posts in this theme already have generated prompts.",
        });
        return;
      }

      // Initialize status
      updateStatus(themeId, {
        totalPosts: postsToProcess.length,
        completed: 0,
        inProgress: postsToProcess.length,
        failed: 0,
        status: 'processing'
      });

      // Process in batches
      const batches = [];
      for (let i = 0; i < postsToProcess.length; i += batchSize) {
        batches.push(postsToProcess.slice(i, i + batchSize));
      }

      let completed = 0;
      let failed = 0;

      for (const batch of batches) {
        try {
          const requests = batch.map(post => ({
            postId: post.id,
            themeId,
            aspectRatio
          }));

          const results = await generateBatch(requests);
          
          // Update counts based on results
          results.forEach(result => {
            if (result.success) {
              completed++;
            } else {
              failed++;
            }
          });

          // Update status
          updateStatus(themeId, {
            completed,
            failed,
            inProgress: postsToProcess.length - completed - failed
          });

        } catch (error) {
          console.error('Batch processing error:', error);
          failed += batch.length;
          updateStatus(themeId, {
            completed,
            failed,
            inProgress: postsToProcess.length - completed - failed
          });
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Final status update
      const finalStatus = completed === postsToProcess.length ? 'completed' : 'error';
      updateStatus(themeId, {
        status: finalStatus,
        inProgress: 0
      });

      // Update theme status in database
      await supabase
        .from('themes')
        .update({
          prompt_generation_status: finalStatus,
          prompt_completion_count: completed,
          total_posts_count: postsToProcess.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', themeId);

      toast({
        title: finalStatus === 'completed' ? "Processing Complete" : "Processing Finished with Errors",
        description: `${completed} prompts generated successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
        variant: finalStatus === 'completed' ? 'default' : 'destructive'
      });

    } catch (error) {
      console.error('Theme processing error:', error);
      updateStatus(themeId, {
        status: 'error'
      });
      
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  }, [generateBatch, updateStatus, toast]);

  const getThemeStatus = useCallback((themeId: string): ThemeProcessingStatus | null => {
    return processingStatuses.get(themeId) || null;
  }, [processingStatuses]);

  const clearStatus = useCallback((themeId: string) => {
    setProcessingStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(themeId);
      return newMap;
    });
  }, []);

  return {
    processThemePrompts,
    getThemeStatus,
    clearStatus,
    processingStatuses: Array.from(processingStatuses.values())
  };
};