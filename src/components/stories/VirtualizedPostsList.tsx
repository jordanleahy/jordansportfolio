
import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { PostsCardView } from './PostsCardView';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { VirtualizedPostsListProps, PostGroup } from './VirtualizedPostsList/types';

const ITEM_HEIGHT = 400; // Estimated height of each post card

export const VirtualizedPostsList: React.FC<VirtualizedPostsListProps> = ({
  posts,
  height = 600,
  itemHeight = ITEM_HEIGHT,
  onLoadMorePosts,
  hasMorePosts = false,
  ...cardViewProps
}) => {
  // Group posts by theme for better organization
  const groupedPosts = useMemo((): PostGroup[] => {
    const postsByTheme: Record<string, SocialMediaPost[]> = {};

    posts.forEach(post => {
      const themeId = post.theme_id || 'ungrouped';
      if (!postsByTheme[themeId]) {
        postsByTheme[themeId] = [];
      }
      postsByTheme[themeId].push(post);
    });

    // Convert to array for virtualization
    return Object.entries(postsByTheme).map(([themeId, themePosts]) => ({
      themeId,
      posts: themePosts
    }));
  }, [posts]);

  // Render item function for react-window
  const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const group = groupedPosts[index];
    
    // Load more when near the end
    if (index >= groupedPosts.length - 2 && hasMorePosts && onLoadMorePosts) {
      onLoadMorePosts();
    }

    if (!group) return null;

    return (
      <div style={style}>
        <div className="p-4">
          <PostsCardView
            posts={group.posts}
            {...cardViewProps}
          />
        </div>
      </div>
    );
  }, [groupedPosts, hasMorePosts, onLoadMorePosts, cardViewProps]);

  if (groupedPosts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No posts available
      </div>
    );
  }

  return (
    <div className="w-full">
      <List
        height={height}
        width="100%"
        itemCount={groupedPosts.length}
        itemSize={itemHeight}
        overscanCount={2} // Pre-render 2 items above and below viewport
      >
        {renderItem}
      </List>
      
      {hasMorePosts && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMorePosts}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
};
