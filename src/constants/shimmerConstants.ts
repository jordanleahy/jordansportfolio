import { BaseProcessingStatus, ThemeLifecycleStatus } from '@/types/enums/status';

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
    COMPLETED: BaseProcessingStatus.COMPLETED,
    IN_PROGRESS: BaseProcessingStatus.IN_PROGRESS,
    FAILED: BaseProcessingStatus.FAILED,
  },
  LIFECYCLE_STATUS: {
    PENDING: ThemeLifecycleStatus.PENDING,
    GENERATING: ThemeLifecycleStatus.GENERATING,
    READY: ThemeLifecycleStatus.READY,
    COMPLETED: ThemeLifecycleStatus.COMPLETED,
  }
} as const;

export type ShimmerConstants = typeof SHIMMER_CONSTANTS;