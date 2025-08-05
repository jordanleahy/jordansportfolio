/**
 * Centralized query keys and configurations for React Query caching
 * Helps avoid duplication and ensures consistency
 */

// Query configuration constants
export const QUERY_CONFIG = {
  THEMES_STALE_TIME: 30 * 60 * 1000, // 30 minutes - themes don't change frequently
  POSTS_STALE_TIME: 5 * 60 * 1000,   // 5 minutes - posts change more often
  DEFAULT_STALE_TIME: 2 * 60 * 1000,  // 2 minutes default
} as const;

export const QUERY_KEYS = {
  // Core data queries
  themes: ['themes'] as const,
  posts: ['posts'] as const,
  
  // Parameterized queries
  postsByCategory: (category: string) => ['posts', category] as const,
  postsByTheme: (theme: string) => ['theme-posts', theme] as const,
  individualPrompt: (postId: string) => ['individual-prompt', postId] as const,
} as const;

// Helper to invalidate all post-related queries with background refetch
export const getAllPostQueryKeys = () => [
  QUERY_KEYS.posts,
  QUERY_KEYS.themes,
];

// Helper to get theme-specific query keys for optimistic updates
export const getThemeQueryKeys = (theme: string, category: string) => [
  QUERY_KEYS.postsByCategory(category),
  QUERY_KEYS.postsByTheme(theme),
  QUERY_KEYS.themes,
  QUERY_KEYS.posts,
];