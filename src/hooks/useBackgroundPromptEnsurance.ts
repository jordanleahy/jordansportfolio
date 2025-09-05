import { useEffect, useRef, useCallback } from 'react';
import { useGlobalPromptEnsurance } from './useGlobalPromptEnsurance';
import { supabase } from '@/integrations/supabase/client';

interface BackgroundOptions {
  enabled: boolean;
  checkIntervalMinutes: number;
  autoFixEnabled: boolean;
  maxConcurrentThemes: number;
  aspectRatio: string;
}

const DEFAULT_OPTIONS: BackgroundOptions = {
  enabled: true,
  checkIntervalMinutes: 30, // Check every 30 minutes
  autoFixEnabled: true,
  maxConcurrentThemes: 1, // Conservative for background processing
  aspectRatio: '1:1'
};

export const useBackgroundPromptEnsurance = (options: Partial<BackgroundOptions> = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { scanMissingPrompts, fixThemePrompts, isProcessing } = useGlobalPromptEnsurance();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const isBackgroundRunning = useRef(false);

  // Background check and auto-fix function
  const performBackgroundCheck = useCallback(async () => {
    if (!config.enabled || isBackgroundRunning.current || isProcessing) {
      return;
    }

    try {
      isBackgroundRunning.current = true;
      console.log('🔍 Background prompt check started...');

      const missingStats = await scanMissingPrompts();
      
      if (missingStats.length === 0) {
        console.log('✅ Background check: All prompts are complete');
        return;
      }

      console.log(`📋 Background check: Found ${missingStats.length} themes with missing prompts`);

      if (config.autoFixEnabled) {
        // Process themes with missing prompts one at a time (background processing)
        for (const stat of missingStats.slice(0, config.maxConcurrentThemes)) {
          try {
            console.log(`🔧 Auto-fixing prompts for theme: ${stat.themeName}`);
            await fixThemePrompts(stat.themeId, config.aspectRatio);
            
            // Add delay between themes to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error) {
            console.warn(`⚠️ Background auto-fix failed for theme ${stat.themeName}:`, error);
          }
        }
      }

      lastCheckRef.current = Date.now();
      
    } catch (error) {
      console.error('❌ Background prompt check error:', error);
    } finally {
      isBackgroundRunning.current = false;
    }
  }, [config, scanMissingPrompts, fixThemePrompts, isProcessing]);

  // Initialize background checking
  useEffect(() => {
    if (!config.enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check after a short delay
    const initialTimeout = setTimeout(() => {
      performBackgroundCheck();
    }, 5000); // 5 seconds after component mount

    // Set up recurring checks
    intervalRef.current = setInterval(() => {
      performBackgroundCheck();
    }, config.checkIntervalMinutes * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.enabled, config.checkIntervalMinutes, performBackgroundCheck]);

  // Listen for database changes that might indicate new posts
  useEffect(() => {
    if (!config.enabled) return;

    const channel = supabase
      .channel('background-prompt-watcher')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_media_posts'
        },
        (payload) => {
          console.log('📝 New post detected, triggering prompt check in 10 seconds...');
          // Delay to allow the post to be fully processed
          setTimeout(() => {
            performBackgroundCheck();
          }, 10000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public', 
          table: 'themes'
        },
        (payload) => {
          console.log('🎨 New theme detected, triggering prompt check in 15 seconds...');
          setTimeout(() => {
            performBackgroundCheck();
          }, 15000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.enabled, performBackgroundCheck]);

  // Manual trigger for immediate check
  const triggerImmediateCheck = useCallback(() => {
    performBackgroundCheck();
  }, [performBackgroundCheck]);

  return {
    isBackgroundRunning: isBackgroundRunning.current,
    lastCheck: lastCheckRef.current,
    triggerImmediateCheck,
    config
  };
};