import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';

interface Theme {
  id: string;
  theme_name: string;
  description: string;
  category: string;
  created_at: string;
  prompt_generation_status: string;
}

interface UseOptimizedStoriesDataProps {
  pageSize?: number;
  preloadImages?: boolean;
}

export const useOptimizedStoriesData = ({ 
  pageSize = 50, 
  preloadImages = false 
}: UseOptimizedStoriesDataProps = {}) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  // Fetch themes with minimal data first
  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('id, theme_name, description, category, created_at, prompt_generation_status')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThemes(data || []);
    } catch (err) {
      console.error('Error fetching themes:', err);
      setError('Failed to load themes');
    }
  };

  // Fetch posts with pagination and selective image loading
  const fetchPosts = async (page: number = 0, append: boolean = false) => {
    try {
      const themeIds = themes.map(t => t.id);
      if (themeIds.length === 0) return;

      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Only fetch essential data first
      const selectFields = preloadImages 
        ? 'theme_id, id, title, description, day, created_at, image_1_1_url, image_1_1_status'
        : 'theme_id, id, title, description, day, created_at, image_1_1_status';

      const { data, error } = await supabase
        .from('social_media_posts')
        .select(selectFields)
        .in('theme_id', themeIds)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .neq('status', 'deleted')
        .order('day', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
        .range(from, to);

      if (error) throw error;

      const newPosts = (data || []) as unknown as SocialMediaPost[];
      setHasMorePosts(newPosts.length === pageSize);

      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    }
  };

  // Load more posts (for infinite scroll)
  const loadMorePosts = () => {
    if (hasMorePosts && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  // Grouped posts by theme for efficient rendering
  const groupedPosts = useMemo(() => {
    const groups: Record<string, SocialMediaPost[]> = {};
    posts.forEach(post => {
      if (!groups[post.theme_id]) {
        groups[post.theme_id] = [];
      }
      groups[post.theme_id].push(post);
    });
    return groups;
  }, [posts]);

  // Load missing image data on demand
  const loadImageData = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select(`
          image_16_9_url, image_4_3_url, image_9_16_url, image_3_4_url, image_1_1_url,
          image_16_9_status, image_4_3_status, image_9_16_status, image_3_4_status, image_1_1_status
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Update the specific post with image data
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, ...data } as SocialMediaPost : post
      ));

      return data;
    } catch (err) {
      console.error('Error loading image data:', err);
      return null;
    }
  };

  // Initial load
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await fetchThemes();
      setLoading(false);
    };
    initData();
  }, []);

  // Load posts when themes are available
  useEffect(() => {
    if (themes.length > 0) {
      fetchPosts(0, false);
    }
  }, [themes, pageSize, preloadImages]);

  // Refresh data
  const refreshData = async () => {
    setLoading(true);
    setCurrentPage(0);
    setHasMorePosts(true);
    await fetchThemes();
    setLoading(false);
  };

  return {
    themes,
    posts,
    groupedPosts,
    loading,
    error,
    hasMorePosts,
    loadMorePosts,
    loadImageData,
    refreshData,
  };
};