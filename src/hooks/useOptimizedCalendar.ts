import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useRoutePreloading } from '@/hooks/useRoutePreloading';
import { useRealtimePosts, type RealtimePostUpdate } from '@/hooks/useRealtimePosts';
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
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimePostUpdate[]>([]);

  // Get URL params for tab state (fallback mechanism)
  const urlParams = new URLSearchParams(window.location.search);
  const urlTab = urlParams.get('tab');

  // Get user preferences with enhanced debugging
  const userPrefs = getUserPreferences();
  console.log('[Calendar] User preferences loaded:', userPrefs);
  console.log('[Calendar] URL tab parameter:', urlTab);

  // Primary query: available categories
  const { 
    data: availableCategories = ['cdi', 'contracts'], 
    isLoading: categoriesLoading 
  } = useAvailableCategories(!!user);

  // Initialize active tab with enhanced preference handling
  useEffect(() => {
    if (!isInitialized && availableCategories.length > 0) {
      console.log('[Calendar] Available categories:', availableCategories);
      console.log('[Calendar] User preferred category:', userPrefs.defaultCategory);
      console.log('[Calendar] URL tab parameter:', urlTab);
      
      // Priority order: URL tab > User preference > First available category
      let selectedTab = availableCategories[0]; // Fallback
      
      if (urlTab && availableCategories.includes(urlTab)) {
        selectedTab = urlTab;
        console.log('[Calendar] Using URL tab:', selectedTab);
      } else if (userPrefs.defaultCategory && availableCategories.includes(userPrefs.defaultCategory)) {
        selectedTab = userPrefs.defaultCategory;
        console.log('[Calendar] Using user preference tab:', selectedTab);
      } else {
        console.log('[Calendar] Using fallback tab:', selectedTab);
        console.log('[Calendar] User preference not found in available categories');
      }
      
      setActiveTab(selectedTab);
      setIsInitialized(true);
      
      // Update URL without page reload
      updateURLTab(selectedTab);
      
      console.log('[Calendar] Initialized with tab:', selectedTab);
    }
  }, [availableCategories, userPrefs.defaultCategory, urlTab, isInitialized]);

  // Set up realtime subscriptions for automatic updates
  const handleRealtimeUpdate = (update: RealtimePostUpdate) => {
    console.log('[Calendar] Received realtime update:', update);
    setRealtimeUpdates(prev => [...prev.slice(-9), update]); // Keep last 10 updates for debugging
    
    // Show user feedback for completed images
    const completedStatuses = Object.entries(update.imageStatuses).filter(
      ([_, status]) => status === 'complete'
    );
    
    if (completedStatuses.length > 0) {
      const aspectRatios = completedStatuses.map(([key, _]) => 
        key.replace('image_', '').replace('_status', '').replace('_', ':')
      );
      
      // Dynamic import to avoid bundle size issues
      import('sonner').then(({ toast }) => {
        toast.success(`Image(s) ready: ${aspectRatios.join(', ')}`, {
          description: 'Your images have been processed and are now available.',
          duration: 4000,
        });
      });
    }
  };

  const { 
    isSubscribed = false, 
    logs: realtimeLogs, 
    metrics: realtimeMetrics,
    sessionId,
    clearLogs,
    exportLogs 
  } = useRealtimePosts({
    enabled: !!user,
    userId: user?.id,
    onUpdate: handleRealtimeUpdate,
    enableAdvancedLogging: true,
    verboseLogging: false, // Set to true for verbose debugging
  });

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

  // Helper function to update URL without page reload
  const updateURLTab = (tab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  // Update user preferences when active tab changes
  const handleTabChange = (newTab: string) => {
    console.log('[Calendar] Changing tab from', activeTab, 'to', newTab);
    setActiveTab(newTab);
    
    // Update URL immediately
    updateURLTab(newTab);
    
    // Update user preferences
    const updatedPrefs = {
      defaultCategory: newTab,
      recentCategories: [newTab, ...userPrefs.recentCategories.filter(c => c !== newTab)].slice(0, 5),
    };
    
    console.log('[Calendar] Saving preferences:', updatedPrefs);
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
    
    // Realtime
    isRealtimeConnected: isSubscribed,
    realtimeUpdates,
    
    // Advanced logging & debugging
    realtimeLogs,
    realtimeMetrics,
    realtimeSessionId: sessionId,
    clearRealtimeLogs: clearLogs,
    exportRealtimeLogs: exportLogs,
    
    // Actions
    handleTabChange,
    invalidateCategoryCache,
    getCategoryPosts,
    
    // Utilities
    userPreferences: userPrefs,
  };
};