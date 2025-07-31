import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useRoutePreloading } from '@/hooks/useRoutePreloading';
import type { SocialMediaPost } from '@/types/socialMedia';

// Individual category query hook for granular caching
export const useCategoryPosts = (category: string, enabled = true) => {
  return useQuery({
    queryKey: ['category-posts', category],
    queryFn: () => optimizedSocialMediaService.getAllPosts(category as any),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!category,
  });
};

// Optimized available categories hook
export const useAvailableCategories = (enabled = true) => {
  return useQuery({
    queryKey: ['available-categories'],
    queryFn: () => optimizedSocialMediaService.getAvailableCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => {
      // Ensure known categories appear first, followed by any dynamic categories
      const knownCategories = ['cdi', 'contracts', 'coding ai', 'ai agents'];
      const dynamicCategories = data.filter(c => !knownCategories.includes(c));
      return [...knownCategories.filter(c => data.includes(c)), ...dynamicCategories];
    },
    enabled,
  });
};

// Main calendar hook with progressive loading
export const useOptimizedCalendar = (user: any) => {
  const queryClient = useQueryClient();
  const { getUserPreferences, saveUserPreferences } = useRoutePreloading();
  const [activeTab, setActiveTab] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Get user preferences
  const userPrefs = getUserPreferences();

  // Primary query: available categories
  const { 
    data: availableCategories = ['cdi', 'contracts'], 
    isLoading: categoriesLoading 
  } = useAvailableCategories(!!user);

  // Initialize active tab with user preferences
  useEffect(() => {
    if (!isInitialized && availableCategories.length > 0) {
      // Set active tab to user's preferred category if available, otherwise first category
      const defaultTab = availableCategories.includes(userPrefs.defaultCategory) 
        ? userPrefs.defaultCategory 
        : availableCategories[0];
      
      setActiveTab(defaultTab);
      setIsInitialized(true);
      
      console.log('[Calendar] Initialized with default tab:', defaultTab);
    }
  }, [availableCategories, userPrefs.defaultCategory, isInitialized]);

  // Primary category posts (loads immediately)
  const { 
    data: activeCategoryPosts = [], 
    isLoading: activePostsLoading 
  } = useCategoryPosts(activeTab, !!activeTab);

  // Background loading for other categories
  useEffect(() => {
    if (availableCategories.length > 0 && activeTab) {
      // Start background prefetching of other categories after a short delay
      const timer = setTimeout(() => {
        availableCategories.forEach((category) => {
          if (category !== activeTab) {
            queryClient.prefetchQuery({
              queryKey: ['category-posts', category],
              queryFn: () => optimizedSocialMediaService.getAllPosts(category as any),
              staleTime: 5 * 60 * 1000,
            });
          }
        });
      }, 1000); // 1 second delay to prioritize active category

      return () => clearTimeout(timer);
    }
  }, [availableCategories, activeTab, queryClient]);

  // Update user preferences when active tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    
    // Update user preferences
    const updatedPrefs = {
      defaultCategory: newTab,
      recentCategories: [newTab, ...userPrefs.recentCategories.filter(c => c !== newTab)].slice(0, 5),
    };
    saveUserPreferences(updatedPrefs);
    
    console.log('[Calendar] Tab changed to:', newTab);
  };

  // Optimistic cache invalidation for specific category
  const invalidateCategoryCache = (category: string) => {
    queryClient.invalidateQueries({ queryKey: ['category-posts', category] });
  };

  // Get posts for any category (with caching)
  const getCategoryPosts = (category: string): SocialMediaPost[] => {
    const cachedData = queryClient.getQueryData(['category-posts', category]) as SocialMediaPost[];
    return cachedData || [];
  };

  return {
    // State
    activeTab,
    availableCategories,
    activeCategoryPosts,
    
    // Loading states
    isLoading: categoriesLoading || activePostsLoading,
    categoriesLoading,
    activePostsLoading,
    isInitialized,
    
    // Actions
    handleTabChange,
    invalidateCategoryCache,
    getCategoryPosts,
    
    // Utilities
    userPreferences: userPrefs,
  };
};