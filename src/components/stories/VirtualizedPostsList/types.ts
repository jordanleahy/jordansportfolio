
import type { SocialMediaPost } from '@/types/socialMedia';
import type { PostsTableViewProps } from '@/types/stories/ui';

export interface VirtualizedPostsListProps extends Omit<PostsTableViewProps, 'posts'> {
  posts: SocialMediaPost[];
  height?: number;
  itemHeight?: number;
  onLoadMorePosts?: () => void;
  hasMorePosts?: boolean;
}

export interface PostGroup {
  themeId: string;
  posts: SocialMediaPost[];
}
