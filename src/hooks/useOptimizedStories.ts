import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS, QUERY_CONFIG, getThemeQueryKeys } from '@/constants/queryKeys';
import type { SocialMediaPost } from '@/types/socialMedia';

// ✅ GOOD: Individual theme query hook using themeId

// Theme-specific query hook for theme detail pages
export const useThemePosts = (themeId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.postsByTheme(themeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select(`
          *,
          themes!inner(*)
        `)
        .eq('theme_id', themeId)
        .order('day', { ascending: true });
      
      if (error) throw error;
      
      const posts = data || [];
      
      return {
        posts,
        hasAnyPosts: posts.length > 0
      };
    },
    staleTime: QUERY_CONFIG.POSTS_STALE_TIME,
    enabled: enabled && !!themeId,
  });
};

// ✅ GOOD: Theme details by ID hook - preferred approach

// Combined hook for theme details by ID - gets theme and posts directly by ID
export const useThemeDetailsById = (themeId: string, enabled = true) => {
  const { data: theme, isLoading: isLoadingTheme } = useQuery({
    queryKey: ['theme-by-id', themeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('id', themeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: QUERY_CONFIG.THEMES_STALE_TIME,
    enabled: enabled && !!themeId,
  });
  
  const { data: postsData, isLoading: isLoadingPosts, refetch } = useThemePosts(themeId, enabled && !!themeId);

  return {
    theme,
    posts: postsData?.posts || [],
    hasAnyPosts: postsData?.hasAnyPosts || false,
    isLoading: isLoadingTheme || isLoadingPosts,
    refetch
  };
};

// Optimized available themes hook with better error handling
export const useAvailableThemes = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.themes,
    queryFn: async () => {
      // Import here to avoid circular dependency
      const { optimizedSocialMediaService } = await import('@/services/optimizedSocialMediaService');
      return optimizedSocialMediaService.getAvailableThemes();
    },
    staleTime: QUERY_CONFIG.THEMES_STALE_TIME, // 30 minutes cache
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
    refetchOnWindowFocus: false, // Background refetching only
    refetchOnMount: false, // Use cached data on mount
    retry: 2, // Retry failed requests (reduced from 3)
    retryDelay: (attemptIndex) => Math.min(2000 * 1.5 ** attemptIndex, 15000), // Less aggressive backoff
    enabled,
  });
};

export function useOptimizedStories(user: any) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Connection status is managed at app level via StoriesDashboard
  const connectionStatus = 'connected'; // Remove duplicate realtime subscription
  const isConnected = true;

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
        
        let selectedTab = availableThemes[0].theme_name; // Use theme_name property from service mapping
        
        if (urlTab) {
          const matchingTheme = availableThemes.find(t => t.theme_name === urlTab);
          if (matchingTheme) {
            selectedTab = matchingTheme.theme_name;
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

  // Active theme posts query with optimistic updates 
  const activeTabQuery = useQuery({
    queryKey: QUERY_KEYS.postsByTheme(activeTab),
    queryFn: async () => {
      if (!activeTab) return [];
      
      // Find the theme by name to get its ID
      const selectedTheme = availableThemes.find(t => t.theme_name === activeTab);
      if (!selectedTheme) return [];
      
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('theme_id', selectedTheme.id)
        .order('day', { ascending: true });
      
      if (error) throw error;
      return (data || []) as SocialMediaPost[];
    },
    enabled: !!activeTab && !!user?.id && availableThemes.length > 0,
    staleTime: QUERY_CONFIG.POSTS_STALE_TIME,
    refetchOnWindowFocus: false, // Background refetching only
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });

  const activeTabPosts = activeTabQuery.data || [];

  // Prefetch other themes using React Query
  useEffect(() => {
    if (availableThemes.length > 0 && activeTab && isInitialized) {
      availableThemes.forEach((theme) => {
        if (theme.id !== activeTab) {
          queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.postsByTheme(theme.id),
            queryFn: async () => {
              const { data, error } = await supabase
                .from('social_media_posts')
                .select(`
                  *,
                  themes!inner(*)
                `)
                .eq('theme_id', theme.id)
                .order('day', { ascending: true });
              
              if (error) throw error;
              return data || [];
            },
            staleTime: QUERY_CONFIG.POSTS_STALE_TIME,
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
    // Use background refetching instead of invalidation
    queryClient.refetchQueries({ queryKey: QUERY_KEYS.posts, type: 'active' });
    queryClient.refetchQueries({ queryKey: QUERY_KEYS.themes, type: 'active' });
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