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
    return blogStatusesLoading || 
           colorThemesLoading || 
           hasUploadingPosts || 
           hasAnimatingPosts || 
           hasCreatingBlogs ||
           hasGeneratingImages;
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
    onLoadingChange?.(isTableLoading);
  }, [isTableLoading, onLoadingChange]);

  return {
    isTableLoading,
    blogStatusesLoading,
    colorThemesLoading
  };
}