import React, { memo, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Settings } from 'lucide-react';
import { useOptimizedStoriesData } from '@/hooks/useOptimizedStoriesData';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { VirtualizedPostsList } from './VirtualizedPostsList';
import { PostsCardView } from './PostsCardView';
import { Skeleton } from '@/components/ui/skeleton';
import type { PostsTableViewProps } from '@/types/stories/ui';

interface OptimizedStoriesDashboardProps {
  isVirtualized?: boolean;
  enableSearch?: boolean;
  pageSize?: number;
  preloadImages?: boolean;
}

// Memoized loading skeleton
const PostsSkeleton = memo(() => (
  <div className="space-y-4 p-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-4">
        <div className="flex gap-4">
          <Skeleton className="w-32 h-32 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    ))}
  </div>
));

PostsSkeleton.displayName = 'PostsSkeleton';

export const OptimizedStoriesDashboard: React.FC<OptimizedStoriesDashboardProps> = memo(({
  isVirtualized = false,
  enableSearch = true,
  pageSize = 50,
  preloadImages = false,
}) => {
  const {
    themes,
    posts,
    loading,
    error,
    hasMorePosts,
    loadMorePosts,
    refreshData,
  } = useOptimizedStoriesData({ pageSize, preloadImages });

  const {
    searchQuery,
    handleSearchChange,
    filteredThemes,
    filteredPosts,
    isSearching,
  } = useOptimizedSearch({ themes, posts });

  // Shared props for post views
  const postViewProps: PostsTableViewProps = {
    posts: filteredPosts,
    activeTab: 'draft' as const,
    creatingBlogIds: new Set(),
    onStatusChange: () => {},
    onCopyContent: () => {},
    onDeletePost: () => {},
    onCreateBlogPost: () => {},
    onGenerateVoiceoverScript: () => {},
    onGenerateImagePrompt: () => {},
    onGenerateImage: async () => ({ success: false }),
    onPreviewImage: () => {},
    onPostsChange: refreshData,
    isAdmin: false,
    animatingRows: new Set(),
    completingRows: new Set(),
    getRowAnimationClass: () => '',
    blogStatuses: {},
    onEditPost: () => {},
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">Error loading data: {error}</p>
        <Button onClick={refreshData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and controls */}
      {enableSearch && (
        <div className="flex items-center gap-4 p-6 pb-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search themes and posts..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <Settings className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && <PostsSkeleton />}

      {/* Search indicator */}
      {isSearching && (
        <div className="px-6">
          <p className="text-sm text-muted-foreground">
            Searching... ({searchQuery})
          </p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <Suspense fallback={<PostsSkeleton />}>
          {isVirtualized ? (
            <VirtualizedPostsList
              {...postViewProps}
              posts={filteredPosts}
              onLoadMorePosts={loadMorePosts}
              hasMorePosts={hasMorePosts}
              height={600}
            />
          ) : (
            <div className="space-y-4">
              <PostsCardView
                {...postViewProps}
                posts={filteredPosts}
              />
              
              {/* Load more button for non-virtualized view */}
              {hasMorePosts && !searchQuery && (
                <div className="flex justify-center py-6">
                  <Button
                    onClick={loadMorePosts}
                    variant="outline"
                    disabled={loading}
                  >
                    Load More Posts
                  </Button>
                </div>
              )}
            </div>
          )}
        </Suspense>
      )}

      {/* No results */}
      {!loading && filteredPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground">
            {searchQuery ? 'No posts match your search' : 'No posts available'}
          </p>
          {searchQuery && (
            <Button 
              onClick={() => handleSearchChange('')} 
              variant="outline"
              size="sm"
            >
              Clear Search
            </Button>
          )}
        </div>
      )}

      {/* Performance stats for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 p-2 bg-background border rounded text-xs space-y-1">
          <div>Themes: {filteredThemes.length}</div>
          <div>Posts: {filteredPosts.length}</div>
          <div>Virtualized: {isVirtualized ? 'Yes' : 'No'}</div>
          <div>Preload Images: {preloadImages ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
});

OptimizedStoriesDashboard.displayName = 'OptimizedStoriesDashboard';