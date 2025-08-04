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

// Optimized available categories hook
export const useAvailableCategories = (enabled = true) => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Import here to avoid circular dependency
      const { optimizedSocialMediaService } = await import('@/services/optimizedSocialMediaService');
      return optimizedSocialMediaService.getAvailableCategories();
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
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  // Available categories query
  const { 
    data: availableCategories = [], 
    isLoading: isLoadingAvailableCategories 
  } = useAvailableCategories(!!user);

  // Initialize active tab - Don't wait for categories to exist, initialize when query completes
  useEffect(() => {
    if (!isInitialized && !isLoadingAvailableCategories) {
      if (availableCategories.length > 0) {
        const urlTab = searchParams.get('tab');
        
        let selectedTab = availableCategories[0]; // Fallback
        
        if (urlTab && availableCategories.includes(urlTab)) {
          selectedTab = urlTab;
        }
        
        setActiveTab(selectedTab);
        setIsInitialized(true);
        
        if (!urlTab || urlTab !== selectedTab) {
          setSearchParams({ tab: selectedTab });
        }
      } else {
        // No categories exist for this user - initialize as empty
        setActiveTab('');
        setIsInitialized(true);
      }
    }
  }, [availableCategories, isLoadingAvailableCategories, searchParams, setSearchParams, isInitialized]);

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

  // Prefetch other categories using React Query
  useEffect(() => {
    if (availableCategories.length > 0 && activeTab && isInitialized) {
      availableCategories.forEach((category) => {
        if (category !== activeTab) {
          queryClient.prefetchQuery({
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
            staleTime: 10 * 60 * 1000,
          });
        }
      });
    }
  }, [availableCategories, activeTab, isInitialized, queryClient]);

  const changeTab = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const invalidateCache = () => {
    console.log('🔄 Invalidating stories cache');
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };


  return {
    // State
    activeTab,
    isInitialized,
    
    // Loading states
    isLoadingCategories: isLoadingAvailableCategories,
    isLoadingActiveTab: activeTabQuery.isLoading,
    
    // Data
    availableCategories: availableCategories || [],
    activeTabPosts: activeTabPosts || [],
    
    // New state to distinguish between loading and empty
    hasCategories: availableCategories.length > 0,
    isEmpty: isInitialized && availableCategories.length === 0,
    
    // Realtime data
    connectionStatus,
    isConnected,
    
    // Actions
    changeTab,
    invalidateCache
  };
}