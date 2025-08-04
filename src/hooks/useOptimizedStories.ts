import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedRealtime } from './useUnifiedRealtime';
import type { SocialMediaPost } from '@/types/socialMedia';

// Individual category query hook for granular caching
export const useCategoryPosts = (category: string, enabled = true) => {
  return useQuery({
    queryKey: ['posts', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('category', category)
        .order('day', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!category,
  });
};

// Optimized available themes hook
export const useAvailableThemes = (enabled = true) => {
  return useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      // Import here to avoid circular dependency
      const { optimizedSocialMediaService } = await import('@/services/optimizedSocialMediaService');
      return optimizedSocialMediaService.getAvailableThemes();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled,
  });
};

export function useOptimizedStories(user: any) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Unified realtime connection
  const { connectionStatus, isConnected } = useUnifiedRealtime({
    enabled: !!user?.id,
    userId: user?.id,
    onPostUpdate: (post: SocialMediaPost) => {
      queryClient.invalidateQueries({ queryKey: ['posts', post.category] });
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    }
  });

  // Available themes query
  const { 
    data: availableThemes = [], 
    isLoading: isLoadingAvailableThemes 
  } = useAvailableThemes(!!user);

  // Initialize active tab - Don't wait for themes to exist, initialize when query completes
  useEffect(() => {
    if (!isInitialized && !isLoadingAvailableThemes) {
      if (availableThemes.length > 0) {
        const urlTab = searchParams.get('tab');
        
        let selectedTab = availableThemes[0].theme; // Use theme property
        
        if (urlTab) {
          const matchingTheme = availableThemes.find(t => t.theme === urlTab);
          if (matchingTheme) {
            selectedTab = matchingTheme.theme;
          }
        }
        
        setActiveTab(selectedTab);
        setIsInitialized(true);
        
        if (!urlTab || urlTab !== selectedTab) {
          setSearchParams({ tab: selectedTab });
        }
      } else {
        // No themes exist for this user - initialize as empty
        setActiveTab('');
        setIsInitialized(true);
      }
    }
  }, [availableThemes, isLoadingAvailableThemes, searchParams, setSearchParams, isInitialized]);

  // Active category posts query with optimistic updates
  const activeTabQuery = useQuery({
    queryKey: ['posts', activeTab],
    queryFn: async () => {
      if (!activeTab) return [];
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('category', activeTab)
        .order('day', { ascending: true });
      
      if (error) throw error;
      return (data || []) as SocialMediaPost[];
    },
    enabled: !!activeTab && !!user?.id,
    staleTime: 10 * 60 * 1000, // Increased stale time
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const activeTabPosts = activeTabQuery.data || [];

  // Prefetch other themes using React Query
  useEffect(() => {
    if (availableThemes.length > 0 && activeTab && isInitialized) {
      availableThemes.forEach((theme) => {
        if (theme.theme !== activeTab) {
          queryClient.prefetchQuery({
            queryKey: ['posts', theme.theme],
            queryFn: async () => {
              const { data, error } = await supabase
                .from('social_media_posts')
                .select('*')
                .eq('theme', theme.theme)
                .order('day', { ascending: true });
              
              if (error) throw error;
              return data || [];
            },
            staleTime: 10 * 60 * 1000,
          });
        }
      });
    }
  }, [availableThemes, activeTab, isInitialized, queryClient]);

  const changeTab = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const invalidateCache = () => {
    console.log('🔄 Invalidating stories cache');
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['themes'] });
  };


  return {
    // State
    activeTab,
    isInitialized,
    
    // Loading states
    isLoadingThemes: isLoadingAvailableThemes,
    isLoadingActiveTab: activeTabQuery.isLoading,
    
    // Data
    availableThemes: availableThemes || [],
    activeTabPosts: activeTabPosts || [],
    
    // New state to distinguish between loading and empty
    hasThemes: availableThemes.length > 0,
    isEmpty: isInitialized && availableThemes.length === 0,
    
    // Realtime data
    connectionStatus,
    isConnected,
    
    // Actions
    changeTab,
    invalidateCache
  };
}