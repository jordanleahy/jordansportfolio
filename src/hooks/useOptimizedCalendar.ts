import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Initialize active tab
  useEffect(() => {
    if (!isInitialized && availableCategories.length > 0) {
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
    }
  }, [availableCategories, searchParams, setSearchParams, isInitialized]);

  // Active category posts query
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
      return data || [];
    },
    enabled: !!activeTab && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const activeTabPosts = activeTabQuery.data || [];

  // Background loading for other categories
  useEffect(() => {
    if (availableCategories.length > 0 && activeTab) {
      const timer = setTimeout(() => {
        availableCategories.forEach((category) => {
          if (category !== activeTab) {
            // Prefetch other categories
            supabase
              .from('social_media_posts')
              .select('*')
              .eq('category', category)
              .order('day', { ascending: true });
          }
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [availableCategories, activeTab]);

  const changeTab = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const invalidateCache = () => {
    // Invalidate all post queries
    availableCategories.forEach(category => {
      supabase.from('social_media_posts').select('*').eq('category', category);
    });
  };

  const getCategoryPosts = (category: string) => {
    // This would need to be implemented with proper caching
    return [];
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
    
    // Realtime data
    connectionStatus,
    isConnected,
    
    // Actions
    changeTab,
    invalidateCache,
    getCategoryPosts
  };
}