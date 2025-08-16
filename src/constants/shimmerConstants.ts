export const SHIMMER_CONSTANTS = {
  PREFIXES: {
    PENDING_THEME: 'pending-',
    PENDING_IMPORT: 'pending-import-',
    SHIMMER_ID: 'shimmer-id',
  },
  MESSAGES: {
    GENERATION_FAILED: 'Generation Failed',
    GENERATING_THEME: 'Generating theme...',
    PREPARING_THEME: 'Preparing your theme',
    CANCELLING: 'Cancelling...',
    RETRYING: 'Retrying...',
  },
  TIMEOUTS: {
    LONG_PRESS_THRESHOLD: 600,
    AUTO_NAVIGATION_DELAY: 100,
    BATCH_OPERATION_DELAY: 500,
  },
  TEXT_LIMITS: {
    THEME_NAME_TRUNCATION: 50,
    TRUNCATION_SUFFIX: '...',
  },
  ANIMATIONS: {
    SHIMMER_DURATION: '2s',
  },
  STATUS: {
    COMPLETED: 'completed',
    IN_PROGRESS: 'in_progress',
    FAILED: 'failed',
  }
} as const;

export type ShimmerConstants = typeof SHIMMER_CONSTANTS;