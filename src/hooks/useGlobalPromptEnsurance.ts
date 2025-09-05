import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useThemePromptProcessor } from './useThemePromptProcessor';
import { useToast } from '@/hooks/use-toast';

interface GlobalPromptStatus {
  totalThemes: number;
  themesProcessed: number;
  totalPosts: number;
  postsWithPrompts: number;
  postsMissing: number;
  isProcessing: boolean;
  currentTheme?: string;
}

interface MissingPromptStats {
  themeId: string;
  themeName: string;
  postsWithoutPrompts: number;
  totalPosts: number;
}

export const useGlobalPromptEnsurance = () => {
  const [status, setStatus] = useState<GlobalPromptStatus>({
    totalThemes: 0,
    themesProcessed: 0,
    totalPosts: 0,
    postsWithPrompts: 0,
    postsMissing: 0,
    isProcessing: false
  });

  const { processThemePrompts } = useThemePromptProcessor();
  const { toast } = useToast();
  const isRunning = useRef(false);

  // Scan all themes and posts to find missing prompts
  const scanMissingPrompts = useCallback(async (): Promise<MissingPromptStats[]> => {
    try {
      // Get all themes with their post counts
      const { data: themes, error: themesError } = await supabase
        .from('themes')
        .select(`
          id,
          theme_name,
          social_media_posts (
            id,
            generated_image_prompt,
            individual_prompt_status
          )
        `);

      if (themesError) throw themesError;

      const stats: MissingPromptStats[] = [];
      let totalPosts = 0;
      let postsWithPrompts = 0;

      for (const theme of themes || []) {
        const posts = theme.social_media_posts || [];
        const postsWithoutPrompts = posts.filter(post => 
          !post.generated_image_prompt || 
          post.individual_prompt_status !== 'completed'
        ).length;

        totalPosts += posts.length;
        postsWithPrompts += posts.length - postsWithoutPrompts;

        if (postsWithoutPrompts > 0) {
          stats.push({
            themeId: theme.id,
            themeName: theme.theme_name,
            postsWithoutPrompts,
            totalPosts: posts.length
          });
        }
      }

      setStatus(prev => ({
        ...prev,
        totalThemes: themes?.length || 0,
        totalPosts,
        postsWithPrompts,
        postsMissing: totalPosts - postsWithPrompts
      }));

      return stats;

    } catch (error) {
      console.error('Error scanning missing prompts:', error);
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  // Process all missing prompts globally
  const ensureAllPrompts = useCallback(async (options: {
    aspectRatio?: string;
    forceRegenerate?: boolean;
    maxConcurrentThemes?: number;
  } = {}) => {
    if (isRunning.current) {
      toast({
        title: "Already Processing",
        description: "Global prompt generation is already in progress.",
        variant: "destructive"
      });
      return;
    }

    isRunning.current = true;
    setStatus(prev => ({ ...prev, isProcessing: true, themesProcessed: 0 }));

    try {
      const missingStats = await scanMissingPrompts();

      if (missingStats.length === 0) {
        toast({
          title: "All Prompts Complete",
          description: "All posts already have generated prompts.",
        });
        return;
      }

      const { maxConcurrentThemes = 2, aspectRatio = '1:1', forceRegenerate = false } = options;

      // Process themes in controlled batches
      const batches = [];
      for (let i = 0; i < missingStats.length; i += maxConcurrentThemes) {
        batches.push(missingStats.slice(i, i + maxConcurrentThemes));
      }

      let totalProcessed = 0;

      for (const batch of batches) {
        setStatus(prev => ({ 
          ...prev, 
          currentTheme: batch.map(b => b.themeName).join(', ') 
        }));

        // Process themes in this batch in parallel
        const batchPromises = batch.map(async (stat) => {
          try {
            await processThemePrompts(stat.themeId, {
              aspectRatio,
              forceRegenerate,
              batchSize: 8 // Smaller batches for stability
            });
            return { themeId: stat.themeId, success: true };
          } catch (error) {
            console.error(`Failed to process theme ${stat.themeName}:`, error);
            return { themeId: stat.themeId, success: false, error };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        totalProcessed += batch.length;

        setStatus(prev => ({
          ...prev,
          themesProcessed: totalProcessed
        }));

        // Small delay between batches to prevent overwhelming the system
        if (totalProcessed < missingStats.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Final scan to get updated stats
      await scanMissingPrompts();

      toast({
        title: "Global Processing Complete",
        description: `Processed ${totalProcessed} themes. Check individual theme status for details.`,
      });

    } catch (error) {
      console.error('Global prompt ensurance error:', error);
      toast({
        title: "Global Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      isRunning.current = false;
      setStatus(prev => ({ 
        ...prev, 
        isProcessing: false, 
        currentTheme: undefined 
      }));
    }
  }, [scanMissingPrompts, processThemePrompts, toast]);

  // Auto-fix missing prompts for a specific theme
  const fixThemePrompts = useCallback(async (themeId: string, aspectRatio: string = '1:1') => {
    try {
      await processThemePrompts(themeId, {
        aspectRatio,
        forceRegenerate: false,
        batchSize: 10
      });
      
      // Update global stats after processing
      await scanMissingPrompts();
      
    } catch (error) {
      console.error(`Error fixing prompts for theme ${themeId}:`, error);
      throw error;
    }
  }, [processThemePrompts, scanMissingPrompts]);

  // Get summary of missing prompts by theme
  const getMissingPromptsSummary = useCallback(async () => {
    return await scanMissingPrompts();
  }, [scanMissingPrompts]);

  return {
    status,
    scanMissingPrompts,
    ensureAllPrompts,
    fixThemePrompts,
    getMissingPromptsSummary,
    isProcessing: status.isProcessing
  };
};