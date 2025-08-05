import type { AspectRatio } from '@/types/bulkImageGeneration';

// Common aspect ratios used throughout the app
export const ASPECT_RATIOS: AspectRatio[] = ['16:9', '9:16', '4:3', '3:4'];

// Aspect ratio keys for database fields
export const ASPECT_RATIO_KEYS = ['16_9', '9_16', '4_3', '3_4'] as const;

// Post status values
export const POST_STATUSES = ['draft', 'scheduled', 'published'] as const;

// File validation constants
export const IMAGE_VALIDATION = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  COMPLETION: 1000,
  EXIT: 300
} as const;

// Query stale times
export const QUERY_STALE_TIMES = {
  POSTS: 5 * 60 * 1000,     // 5 minutes
  THEMES: 30 * 60 * 1000,   // 30 minutes
  BLOG_STATUS: 2 * 60 * 1000, // 2 minutes
  COLOR_THEMES: 10 * 60 * 1000 // 10 minutes
} as const;