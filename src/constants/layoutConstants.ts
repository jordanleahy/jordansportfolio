export const LAYOUT_CONSTANTS = {
  GRID: {
    CATEGORIES: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    POSTS: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    COMPACT: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },
  SPACING: {
    GRID_GAP: 'gap-6',
    CARD_GAP: 'gap-4',
    SECTION_GAP: 'gap-8',
  },
  ASPECT_RATIOS: {
    STORY_CARD: '16/9',
    THUMBNAIL: '4/3',
    SQUARE: '1/1',
  },
  SIZES: {
    THUMBNAIL_HEIGHT: 'h-16',
    CARD_MIN_HEIGHT: 'min-h-[200px]',
    SHIMMER_HEIGHT: 'h-48',
  }
} as const;

export type LayoutConstants = typeof LAYOUT_CONSTANTS;