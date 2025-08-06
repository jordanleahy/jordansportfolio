import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedRealtime } from './useUnifiedRealtime';
import { QUERY_KEYS, QUERY_CONFIG, getThemeQueryKeys } from '@/constants/queryKeys';
import type { SocialMediaPost } from '@/types/socialMedia';

// Individual category query hook for granular caching
export const useCategoryPosts = (category: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.postsByCategory(category),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('category', category)
        .order('day', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: QUERY_CONFIG.POSTS_STALE_TIME,
    enabled: enabled && !!category,
  });
};

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
      return data || [];
    },
    staleTime: QUERY_CONFIG.POSTS_STALE_TIME,
    enabled: enabled && !!themeId,
  });
};

// Theme lookup by name hook - gets theme ID from theme name
export const useThemeByName = (themeName: string, enabled = true) => {
  return useQuery({
    queryKey: ['theme-by-name', themeName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('theme_name', themeName)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: QUERY_CONFIG.THEMES_STALE_TIME,
    enabled: enabled && !!themeName,
  });
};

// Combined hook for theme details by name - gets theme and posts
export const useThemeDetailsByName = (themeName: string, enabled = true) => {
  const { data: theme, isLoading: isLoadingTheme } = useThemeByName(themeName, enabled);
  const { data: posts = [], isLoading: isLoadingPosts, refetch } = useThemePosts(theme?.id || '', !!theme?.id);

  return {
    theme,
    posts,
    isLoading: isLoadingTheme || isLoadingPosts,
    refetch
  };
};

// Optimized available themes hook
export const useAvailableThemes = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.themes,
    queryFn: async () => {
      // Import here to avoid circular dependency
      const { optimizedSocialMediaService } = await import('@/services/optimizedSocialMediaService');
      return optimizedSocialMediaService.getAvailableThemes();
    },
    staleTime: QUERY_CONFIG.THEMES_STALE_TIME, // Increased to 30 minutes
    refetchOnWindowFocus: false, // Background refetching only
    refetchOnMount: false, // Use cached data on mount
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
      // Use optimistic updates instead of invalidations
      queryClient.setQueryData(QUERY_KEYS.themes, (oldThemes: any) => {
        if (!oldThemes) return oldThemes;
        // Optimistically update theme data if needed
        return oldThemes;
      });
      
      // Background refetch instead of immediate invalidation
      queryClient.refetchQueries({ 
        queryKey: QUERY_KEYS.postsByCategory(post.category),
        type: 'active' 
      });
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

  // Active category posts query with optimistic updates
  const activeTabQuery = useQuery({
    queryKey: QUERY_KEYS.postsByCategory(activeTab),
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