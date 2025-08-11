import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS, QUERY_CONFIG } from '@/constants/queryKeys';
import type { ThemeWithPosts } from '@/types/stories';

// Optimized theme fetching with minimal data transfer
export const useOptimizedThemes = () => {
  return useQuery({
    queryKey: QUERY_KEYS.availableThemes(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('themes')
        .select(`
          id,
          theme_name,
          category,
          description,
          updated_at,
          post_count:social_media_posts(count),
          first_post:social_media_posts(id, title, description, image_1_1_url, image_1_1_status, day)
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform to expected format with minimal data
      return (data || []).map(theme => ({
        id: theme.id,
        theme_name: theme.theme_name,
        category: theme.category,
        description: theme.description,
        post_count: theme.post_count?.[0]?.count || 0,
        first_post: theme.first_post?.[0] || null,
        updated_at: theme.updated_at,
      })) as ThemeWithPosts[];
    },
    staleTime: QUERY_CONFIG.THEMES_STALE_TIME,
    gcTime: QUERY_CONFIG.THEMES_GC_TIME,
  });
};

// Prefetch theme details for hover states
export const usePrefetchThemeDetails = () => {
  const queryClient = useQueryClient();
  
  return (themeId: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.postsByTheme(themeId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('social_media_posts')
          .select('id, title, description, image_1_1_url, image_1_1_status, day')
          .eq('theme_id', themeId)
          .order('day', { ascending: true })
          .limit(10); // Only prefetch first 10 posts
        
        if (error) throw error;
        return data || [];
      },
      staleTime: 2 * 60 * 1000, // 2 minutes for prefetched data
    });
  };
};

// Batch fetch multiple themes efficiently
export const useBatchThemeQueries = (themeIds: string[]) => {
  return useQueries({
    queries: themeIds.map(id => ({
      queryKey: QUERY_KEYS.postsByTheme(id),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('social_media_posts')
          .select('id, title, description, image_1_1_url, image_1_1_status, day')
          .eq('theme_id', id)
          .order('day', { ascending: true });
        
        if (error) throw error;
        return data || [];
      },
      staleTime: QUERY_CONFIG.POSTS_STALE_TIME,
      enabled: !!id,
    })),
  });
};