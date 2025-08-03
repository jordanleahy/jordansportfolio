import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeConnection } from './realtime/useRealtimeConnection';
import { useRealtimeUpdates } from './realtime/useRealtimeUpdates';
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
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('category')
        .not('category', 'is', null);
      
      if (error) throw error;
      
      const categories = Array.from(new Set(data?.map(item => item.category) || []));
      return categories.filter(Boolean);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => {
      // Ensure known categories appear first
      const knownCategories = ['cdi', 'contracts', 'coding ai', 'ai agents'];
      const dynamicCategories = data.filter(c => !knownCategories.includes(c));
      return [...knownCategories.filter(c => data.includes(c)), ...dynamicCategories];
    },
    enabled,
  });
};

export function useOptimizedCalendar(user: any) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Realtime connection
  const { status: connectionStatus, isConnected } = useRealtimeConnection({
    enabled: !!user?.id,
    userId: user?.id
  });

  // Realtime updates processing
  const { processor, cacheManager } = useRealtimeUpdates({
    enabled: !!user?.id,
    onImageComplete: (data) => {
      console.log('Image completed:', data);
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
    console.log('🔄 Invalidating calendar cache');
    // Use the cacheManager from realtime updates if available
    if (cacheManager) {
      cacheManager.invalidatePattern('posts');
    }
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