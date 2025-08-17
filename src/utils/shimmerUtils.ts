import { PendingTheme } from '@/types/stories';

/**
 * Check if all posts have completed individual prompt generation
 */
export const areAllPostPromptsCompleted = (posts: any[]): boolean => {
  if (!posts || posts.length === 0) return false;
  return posts.every(post => post.individual_prompt_status === 'completed');
};

/**
 * Simple shimmer visibility logic: show when user submits text until all individual posts complete
 */
export const shouldShowShimmer = (
  pendingTheme: PendingTheme | null,
  allPosts?: any[]
): boolean => {
  if (!pendingTheme) return false;
  if (!pendingTheme.theme_id) return true;
  
  const themePosts = allPosts?.filter(post => post.theme_id === pendingTheme.theme_id);
  if (!themePosts || themePosts.length === 0) return true;
  
  return !areAllPostPromptsCompleted(themePosts);
};