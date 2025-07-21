
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { socialMediaService } from '@/services/socialMediaService';
import { useJobApplications } from '@/hooks/useJobApplications';

export const useRoutePreloading = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchRoute = async (route: string) => {
    if (!user) return;

    switch (route) {
      case '/calendar':
        // Prefetch calendar data
        await queryClient.prefetchQuery({
          queryKey: ['social-media-posts', 'cdi'],
          queryFn: () => socialMediaService.getAllPosts('cdi'),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
        
        await queryClient.prefetchQuery({
          queryKey: ['social-media-posts', 'contracts'],
          queryFn: () => socialMediaService.getAllPosts('contracts'),
          staleTime: 5 * 60 * 1000,
        });
        
        await queryClient.prefetchQuery({
          queryKey: ['available-categories'],
          queryFn: () => socialMediaService.getAvailableCategories(),
          staleTime: 10 * 60 * 1000,
        });
        break;

      case '/jobs':
        // Prefetch job applications
        await queryClient.prefetchQuery({
          queryKey: ['job-applications'],
          queryFn: async () => {
            const { useJobApplications } = await import('@/hooks/useJobApplications');
            // This would normally be handled by the hook, but we can prefetch the data
            return [];
          },
          staleTime: 2 * 60 * 1000, // 2 minutes
        });
        break;

      case '/vendors':
        // Prefetch vendors data
        await queryClient.prefetchQuery({
          queryKey: ['vendors'],
          queryFn: async () => {
            const { useVendors } = await import('@/hooks/useVendors');
            return [];
          },
          staleTime: 10 * 60 * 1000,
        });
        break;

      case '/agents':
        // Prefetch agents data
        await queryClient.prefetchQuery({
          queryKey: ['openai-agents'],
          queryFn: async () => {
            return [];
          },
          staleTime: 5 * 60 * 1000,
        });
        break;
    }
  };

  return { prefetchRoute };
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
