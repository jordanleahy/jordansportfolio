import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PendingTheme, ThemeWithPosts } from '@/types/stories';
import { shouldShowShimmer, areAllPostPromptsCompleted } from '@/utils/shimmerUtils';

interface ThemeShimmerOptions {
  pendingTheme: PendingTheme | null;
  setPendingTheme: React.Dispatch<React.SetStateAction<PendingTheme | null>>;
}

/**
 * Simplified hook for managing theme shimmer visibility
 * Centralizes all shimmer logic and ensures completion is based on all individual prompts
 */
export const useThemeShimmer = ({
  pendingTheme,
  setPendingTheme
}: ThemeShimmerOptions) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const lastLocationRef = useRef(location.pathname);
  const [themePosts, setThemePosts] = useState<any[]>([]);
  const completionCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch posts for the pending theme to check individual completion
  useEffect(() => {
    console.log('🔍 SHIMMER: Fetching posts effect triggered', {
      pendingTheme: pendingTheme ? {
        theme_id: pendingTheme.theme_id,
        theme_name: pendingTheme.theme_name
      } : null
    });
    
    if (!pendingTheme?.theme_id) {
      console.log('❌ SHIMMER: No pending theme or theme_id, clearing posts');
      setThemePosts([]);
      return;
    }

    const fetchThemePosts = async () => {
      try {
        console.log('📡 SHIMMER: Fetching posts for theme_id:', pendingTheme.theme_id);
        const { data: posts } = await supabase
          .from('social_media_posts')
          .select('id, individual_prompt_status, theme_id')
          .eq('theme_id', pendingTheme.theme_id);
        
        console.log('📊 SHIMMER: Posts fetched:', {
          count: posts?.length || 0,
          posts: posts?.map(p => ({
            id: p.id,
            status: p.individual_prompt_status
          }))
        });
        
        if (posts) {
          setThemePosts(posts);
        }
      } catch (error) {
        console.error('❌ SHIMMER: Error fetching theme posts:', error);
      }
    };

    fetchThemePosts();

    // Set up real-time subscription for post updates
    const channel = supabase
      .channel('theme-posts-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'social_media_posts',
          filter: `theme_id=eq.${pendingTheme.theme_id}`
        },
        (payload) => {
          console.log('📡 Post updated:', payload.new);
          setThemePosts(prev => 
            prev.map(post => 
              post.id === payload.new.id 
                ? { ...post, individual_prompt_status: payload.new.individual_prompt_status }
                : post
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pendingTheme?.theme_id]);

  // Simple cleanup function
  const clearPendingThemeState = () => {
    console.log('🧹 Clearing pending theme state');
    setPendingTheme(null);
    setThemePosts([]);
    
    if (completionCheckRef.current) {
      clearTimeout(completionCheckRef.current);
      completionCheckRef.current = null;
    }
  };

  // Debug effect to check dependencies
  useEffect(() => {
    console.log('🔧 COMPLETION EFFECT DEPENDENCIES CHANGED:', {
      pendingTheme: !!pendingTheme,
      themePostsLength: themePosts?.length || 0,
      navigateExists: !!navigate
    });
  }, [pendingTheme, themePosts, navigate]);

  // Simplified completion check - focus only on post completion
  useEffect(() => {
    console.log('🔍 COMPLETION CHECK:', {
      hasPendingTheme: !!pendingTheme,
      pendingThemeId: pendingTheme?.theme_id,
      totalThemePosts: themePosts.length
    });

    if (!pendingTheme?.theme_id) {
      console.log('❌ COMPLETION: No pending theme or theme_id, skipping completion check');
      return;
    }

    // Get posts for this theme
    const currentThemePosts = themePosts.filter(post => post.theme_id === pendingTheme.theme_id);
    
    console.log('📊 COMPLETION: Current theme posts:', {
      themeId: pendingTheme.theme_id,
      postsForTheme: currentThemePosts.length,
      allPosts: currentThemePosts.map(p => ({
        id: p.id,
        status: p.individual_prompt_status
      }))
    });

    // Check if all posts are completed
    const postsCompleted = currentThemePosts.length > 0 && areAllPostPromptsCompleted(currentThemePosts);

    console.log('⭐ COMPLETION STATUS:', {
      postsCompleted,
      shouldNavigate: postsCompleted
    });
    
    if (postsCompleted) {
      console.log('✅ All posts completed - clearing shimmer and navigating to theme');
      clearPendingThemeState();
      navigate(`/stories/id/${pendingTheme.theme_id}`);
    }
  }, [pendingTheme, themePosts, navigate]);

  // Clear pending theme when user navigates away from stories page
  useEffect(() => {
    const currentPath = location.pathname;
    const lastPath = lastLocationRef.current;
    
    if (lastPath === '/stories' && currentPath !== '/stories' && pendingTheme) {
      console.log('🚢 User navigated away from stories, clearing pending theme');
      clearPendingThemeState();
    }
    
    lastLocationRef.current = currentPath;
  }, [location.pathname, pendingTheme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (completionCheckRef.current) {
        clearTimeout(completionCheckRef.current);
      }
    };
  }, []);

  // Function to manually dismiss shimmer
  const dismissShimmer = () => {
    console.log('❌ User manually dismissed shimmer');
    clearPendingThemeState();
  };

  // Function to handle theme card click (navigation)
  const handleThemeClick = (themeId: string) => {
    console.log('🎯 User clicked theme, clearing pending state');
    clearPendingThemeState();
    
    setTimeout(() => {
      navigate(`/stories/id/${themeId}`);
    }, 0);
  };

  const shimmerVisible = shouldShowShimmer(pendingTheme, themePosts);
  
  console.log('✨ SHIMMER CHECK:', {
    hasPendingTheme: !!pendingTheme,
    pendingThemeObject: pendingTheme ? {
      theme_id: pendingTheme.theme_id,
      theme_name: pendingTheme.theme_name,
      description: pendingTheme.description
    } : null,
    totalPosts: themePosts.length,
    completedPosts: themePosts.filter(p => p.individual_prompt_status === 'completed').length,
    shimmerVisible,
    shouldShowShimmerResult: shouldShowShimmer(pendingTheme, themePosts)
  });

  return {
    dismissShimmer,
    handleThemeClick,
    shouldShowShimmer: shimmerVisible,
    completionProgress: {
      total: themePosts.length,
      completed: themePosts.filter(post => post.individual_prompt_status === 'completed').length,
      isComplete: themePosts.length > 0 && themePosts.every(post => post.individual_prompt_status === 'completed')
    }
  };
};