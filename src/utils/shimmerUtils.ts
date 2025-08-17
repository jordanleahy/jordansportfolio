import { SHIMMER_CONSTANTS } from '@/constants/shimmerConstants';
import { ThemeWithPosts, PendingTheme } from '@/types/stories';

/**
 * Centralized utility functions for shimmer completion logic
 */

/**
 * Check if all posts in a theme have completed individual prompt generation
 */
export const areAllPostPromptsCompleted = (posts: any[]): boolean => {
  if (!posts || posts.length === 0) return false;
  return posts.every(post => post.individual_prompt_status === 'completed');
};

/**
 * Check if a theme has completed all individual post prompts (simplified)
 */
export const isThemeFullyComplete = (theme: ThemeWithPosts, themePosts?: any[]): boolean => {
  // Only check individual post completion - ignore theme-level status
  if (themePosts && themePosts.length > 0) {
    return areAllPostPromptsCompleted(themePosts);
  }
  
  // If no posts provided, can't be complete
  return false;
};

/**
 * Find the completed theme that matches a pending theme (simplified)
 */
export const findCompletedTheme = (
  pendingTheme: PendingTheme | null, 
  availableThemes: ThemeWithPosts[],
  allPosts?: any[]
): ThemeWithPosts | null => {
  if (!pendingTheme || !pendingTheme.theme_id) return null;
  
  const matchingTheme = availableThemes.find(theme => theme.id === pendingTheme.theme_id);
  if (!matchingTheme) return null;
  
  // Get posts for this specific theme
  const themePosts = allPosts?.filter(post => post.theme_id === matchingTheme.id);
  
  // Only check if all individual posts are completed
  if (themePosts && themePosts.length > 0) {
    return areAllPostPromptsCompleted(themePosts) ? matchingTheme : null;
  }
  
  return null;
};

/**
 * Ultra-simplified shimmer visibility logic
 * Show shimmer when user submits text until all individual posts complete
 */
export const shouldShowShimmer = (
  pendingTheme: PendingTheme | null,
  allPosts?: any[]
): boolean => {
  // No pending theme = no shimmer
  if (!pendingTheme) return false;
  
  // If no theme_id yet (still generating), always show shimmer
  if (!pendingTheme.theme_id) return true;
  
  // Find posts for this theme
  const themePosts = allPosts?.filter(post => post.theme_id === pendingTheme.theme_id);
  
  // If no posts yet, keep showing shimmer (they're still being created)
  if (!themePosts || themePosts.length === 0) return true;
  
  // Show shimmer until ALL individual posts have completed prompts
  return !areAllPostPromptsCompleted(themePosts);
};