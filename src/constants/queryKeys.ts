/**
 * Centralized query keys for React Query caching
 * Helps avoid duplication and ensures consistency
 */

export const QUERY_KEYS = {
  // Core data queries
  themes: ['themes'] as const,
  posts: ['posts'] as const,
  
  // Parameterized queries
  postsByCategory: (category: string) => ['posts', category] as const,
  postsByTheme: (theme: string) => ['theme-posts', theme] as const,
  individualPrompt: (postId: string) => ['individual-prompt', postId] as const,
} as const;

// Helper to invalidate all post-related queries
export const getAllPostQueryKeys = () => [
  QUERY_KEYS.posts,
  QUERY_KEYS.themes,
];

// Helper to get theme-specific query keys for invalidation
export const getThemeQueryKeys = (theme: string, category: string) => [
  QUERY_KEYS.postsByCategory(category),
  QUERY_KEYS.postsByTheme(theme),
  QUERY_KEYS.themes,
  QUERY_KEYS.posts,
];