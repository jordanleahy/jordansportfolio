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
 * Check if a theme has completed all generation processes
 */
export const isThemeFullyComplete = (theme: ThemeWithPosts, themePosts?: any[]): boolean => {
  // Theme is complete if prompt generation is done
  const themeComplete = theme.prompt_generation_status === SHIMMER_CONSTANTS.STATUS.COMPLETED;
  
  // If posts are provided, also check individual prompt completion
  if (themePosts && themePosts.length > 0) {
    const postsComplete = areAllPostPromptsCompleted(themePosts);
    return themeComplete && postsComplete;
  }
  
  // If no posts provided, just check theme completion
  return themeComplete;
};

/**
 * Find the completed theme that matches a pending theme
 */
export const findCompletedTheme = (
  pendingTheme: PendingTheme | null, 
  availableThemes: ThemeWithPosts[],
  allPosts?: any[]
): ThemeWithPosts | null => {
  if (!pendingTheme || !pendingTheme.theme_id) return null;
  
  const matchingTheme = availableThemes.find(theme => theme.id === pendingTheme.theme_id);
  if (!matchingTheme) return null;
  
  // Get posts for this specific theme if allPosts provided
  const themePosts = allPosts?.filter(post => post.theme_id === matchingTheme.id);
  
  return isThemeFullyComplete(matchingTheme, themePosts) ? matchingTheme : null;
};

/**
 * Check if shimmer should be visible based on pending theme and completion state
 */
export const shouldShowShimmer = (
  pendingTheme: PendingTheme | null,
  availableThemes: ThemeWithPosts[],
  allPosts?: any[]
): boolean => {
  if (!pendingTheme) return false;
  
  const completedTheme = findCompletedTheme(pendingTheme, availableThemes, allPosts);
  return !completedTheme;
};