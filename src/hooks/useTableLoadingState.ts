import { useMemo, useEffect } from 'react';
import { useColorThemes } from './useColorThemes';
import { useBatchBlogStatus } from './useBatchBlogStatus';
import type { SocialMediaPost } from '@/types/socialMedia';

interface UseTableLoadingStateProps {
  posts: SocialMediaPost[];
  hasUploadingPosts: boolean;
  hasAnimatingPosts: boolean;
  hasCreatingBlogs: boolean;
  hasGeneratingImages: boolean;
  onLoadingChange?: (isLoading: boolean) => void;
}

export function useTableLoadingState({
  posts,
  hasUploadingPosts,
  hasAnimatingPosts,
  hasCreatingBlogs,
  hasGeneratingImages,
  onLoadingChange
}: UseTableLoadingStateProps) {
  // External data loading states
  const { isLoading: colorThemesLoading } = useColorThemes();
  const postIds = posts.map(post => post.id);
  const { isLoading: blogStatusesLoading } = useBatchBlogStatus(postIds);

  // Compute combined loading state
  const isTableLoading = useMemo(() => {
    const loading = blogStatusesLoading || 
           colorThemesLoading || 
           hasUploadingPosts || 
           hasAnimatingPosts || 
           hasCreatingBlogs ||
           hasGeneratingImages;
    
    // Debug log to see what's causing the loading
    if (loading) {
      console.log('Table still loading:', {
        blogStatusesLoading,
        colorThemesLoading,
        hasUploadingPosts,
        hasAnimatingPosts,
        hasCreatingBlogs,
        hasGeneratingImages
      });
    }
    
    return loading;
  }, [
    blogStatusesLoading,
    colorThemesLoading,
    hasUploadingPosts,
    hasAnimatingPosts,
    hasCreatingBlogs,
    hasGeneratingImages
  ]);

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isTableLoading);
    }
  }, [isTableLoading]); // Remove onLoadingChange from deps to prevent re-renders

  return {
    isTableLoading,
    blogStatusesLoading,
    colorThemesLoading
  };
}