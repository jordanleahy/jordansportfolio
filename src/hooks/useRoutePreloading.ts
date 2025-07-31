
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';

// Get user preferences from localStorage with enhanced debugging
const getUserPreferences = () => {
  try {
    const prefsString = localStorage.getItem('user-preferences');
    console.log('[Storage] Raw preferences from localStorage:', prefsString);
    
    if (prefsString) {
      const parsed = JSON.parse(prefsString);
      console.log('[Storage] Parsed preferences:', parsed);
      return parsed;
    } else {
      console.log('[Storage] No preferences found, using defaults');
      return { defaultCategory: 'cdi', recentCategories: ['cdi', 'contracts'] };
    }
  } catch (error) {
    console.error('[Storage] Error reading preferences:', error);
    return { defaultCategory: 'cdi', recentCategories: ['cdi', 'contracts'] };
  }
};

// Save user preferences to localStorage with enhanced debugging
const saveUserPreferences = (prefs: { defaultCategory: string; recentCategories: string[] }) => {
  try {
    const prefsString = JSON.stringify(prefs);
    localStorage.setItem('user-preferences', prefsString);
    console.log('[Storage] Preferences saved successfully:', prefs);
    
    // Verify the save worked
    const verification = localStorage.getItem('user-preferences');
    if (verification === prefsString) {
      console.log('[Storage] Save verification: SUCCESS');
    } else {
      console.warn('[Storage] Save verification: FAILED');
    }
  } catch (error) {
    console.error('[Storage] Error saving preferences:', error);
  }
};

export const useRoutePreloading = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchRoute = async (route: string) => {
    if (!user) return;

    const userPrefs = getUserPreferences();

    switch (route) {
      case '/calendar':
        console.log('[Prefetch] Starting calendar data prefetch');
        
        // 1. Prefetch available categories first (highest priority)
        await queryClient.prefetchQuery({
          queryKey: ['available-categories'],
          queryFn: () => optimizedSocialMediaService.getAvailableCategories(),
          staleTime: 10 * 60 * 1000,
        });

        // 2. Prefetch user's default category immediately
        queryClient.prefetchQuery({
          queryKey: ['category-posts', userPrefs.defaultCategory],
          queryFn: () => optimizedSocialMediaService.getAllPosts(userPrefs.defaultCategory as any),
          staleTime: 5 * 60 * 1000,
        });

        // 3. Background prefetch of recent categories
        setTimeout(() => {
          userPrefs.recentCategories.forEach((category) => {
            if (category !== userPrefs.defaultCategory) {
              queryClient.prefetchQuery({
                queryKey: ['category-posts', category],
                queryFn: () => optimizedSocialMediaService.getAllPosts(category as any),
                staleTime: 5 * 60 * 1000,
              });
            }
          });
        }, 500);

        console.log('[Prefetch] Calendar prefetch completed');
        break;

      case '/vendors':
        console.log('[Prefetch] Starting vendors data prefetch');
        const { useVendors } = await import('@/hooks/useVendors');
        await queryClient.prefetchQuery({
          queryKey: ['vendors'],
          queryFn: async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data, error } = await supabase.from('vendors').select('*').order('company_name');
            if (error) throw error;
            return data || [];
          },
          staleTime: 10 * 60 * 1000,
        });
        break;

      case '/jobs':
        console.log('[Prefetch] Starting jobs data prefetch');
        await queryClient.prefetchQuery({
          queryKey: ['job-applications'],
          queryFn: async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data } = await supabase.from('job_applications').select('*').order('created_at', { ascending: false });
            return data || [];
          },
          staleTime: 2 * 60 * 1000,
        });
        break;

      case '/agents':
        console.log('[Prefetch] Starting agents data prefetch');
        await queryClient.prefetchQuery({
          queryKey: ['openai-agents'],
          queryFn: async () => {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data } = await supabase.from('openai_agents').select('*').order('created_at', { ascending: false });
            return data || [];
          },
          staleTime: 5 * 60 * 1000,
        });
        break;
    }
  };

  return { prefetchRoute, getUserPreferences, saveUserPreferences };
};

export const useNavigationPreloading = () => {
  const { prefetchRoute } = useRoutePreloading();

  const handleMouseEnter = (route: string) => {
    // Debounced prefetch on hover
    const timer = setTimeout(() => {
      prefetchRoute(route);
    }, 100);

    return () => clearTimeout(timer);
  };

  const handleFocus = (route: string) => {
    prefetchRoute(route);
  };

  return { handleMouseEnter, handleFocus };
};
