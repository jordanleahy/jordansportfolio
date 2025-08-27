import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { PostsCardView } from './PostsCardView';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { PostsTableViewProps } from '@/types/stories/ui';

interface VirtualizedPostsListProps extends Omit<PostsTableViewProps, 'posts'> {
  posts: SocialMediaPost[];
  height?: number;
  itemHeight?: number;
  onLoadMorePosts?: () => void;
  hasMorePosts?: boolean;
}

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
  const groupedPosts = useMemo(() => {
    const groups: { themeId: string; posts: SocialMediaPost[] }[] = [];
    const postsByTheme: Record<string, SocialMediaPost[]> = {};

    posts.forEach(post => {
      if (!postsByTheme[post.theme_id]) {
        postsByTheme[post.theme_id] = [];
      }
      postsByTheme[post.theme_id].push(post);
    });

    // Convert to array for virtualization
    Object.entries(postsByTheme).forEach(([themeId, themePosts]) => {
      groups.push({ themeId, posts: themePosts });
    });

    return groups;
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