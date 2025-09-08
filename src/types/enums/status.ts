// ============= UNIFIED STATUS ENUM SYSTEM =============
// This file centralizes all status types to eliminate inconsistencies

// Base processing status - used across all processing operations
export enum BaseProcessingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Content/Post status - for published content
export enum ContentStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled', 
  PUBLISHED = 'published',
  DELETED = 'deleted'
}

// Image generation status - extends base with image-specific states
export enum ImageGenerationStatus {
  NONE = 'none',
  PENDING = 'pending',
  GENERATING = 'generating', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Theme lifecycle status - for overall theme state
export enum ThemeLifecycleStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  READY = 'ready',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Processing operation types
export enum ProcessingOperation {
  GENERATE = 'generate',
  BULK_GENERATE = 'bulk_generate', 
  REGENERATE_PROMPT = 'regenerate_prompt'
}

// Agent status
export enum AgentStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DEPRECATED = 'deprecated'
}

// Event status
export enum EventStatus {
  UPCOMING = 'upcoming',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed', 
  CANCELLED = 'cancelled'
}

// Sync status for API operations
export enum SyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed'
}

// ============= TYPE UNIONS FOR FLEXIBILITY =============

export type ProcessingStatusType = BaseProcessingStatus | ThemeLifecycleStatus;
export type AnyStatus = BaseProcessingStatus | ContentStatus | ImageGenerationStatus | ThemeLifecycleStatus | AgentStatus | EventStatus | SyncStatus;

// ============= STATUS CHECKING UTILITIES =============

export const StatusUtils = {
  // Check if status indicates completion
  isCompleted: (status: string): boolean => {
    return status === BaseProcessingStatus.COMPLETED || 
           status === ImageGenerationStatus.COMPLETED ||
           status === ThemeLifecycleStatus.COMPLETED ||
           status === EventStatus.COMPLETED;
  },

  // Check if status indicates active processing
  isProcessing: (status: string): boolean => {
    return status === BaseProcessingStatus.IN_PROGRESS ||
           status === ImageGenerationStatus.GENERATING ||
           status === ThemeLifecycleStatus.GENERATING;
  },

  // Check if status indicates failure
  isFailed: (status: string): boolean => {
    return status === BaseProcessingStatus.FAILED ||
           status === ImageGenerationStatus.FAILED ||
           status === ThemeLifecycleStatus.FAILED ||
           status === SyncStatus.FAILED;
  },

  // Check if status indicates not started
  isNotStarted: (status: string): boolean => {
    return status === BaseProcessingStatus.NOT_STARTED ||
           status === ImageGenerationStatus.NONE ||
           status === ThemeLifecycleStatus.PENDING;
  },

  // Get display label for any status
  getDisplayLabel: (status: string): string => {
    switch (status) {
      case BaseProcessingStatus.NOT_STARTED:
        return 'Not Started';
      case BaseProcessingStatus.IN_PROGRESS:
        return 'In Progress';
      case BaseProcessingStatus.COMPLETED:
        return 'Completed';
      case BaseProcessingStatus.FAILED:
        return 'Failed';
      case ImageGenerationStatus.NONE:
        return 'No Image';
      case ImageGenerationStatus.PENDING:
        return 'Pending';
      case ImageGenerationStatus.GENERATING:
        return 'Generating';
      case ContentStatus.DRAFT:
        return 'Draft';
      case ContentStatus.SCHEDULED:
        return 'Scheduled';
      case ContentStatus.PUBLISHED:
        return 'Published';
      case ContentStatus.DELETED:
        return 'Deleted';
      case ThemeLifecycleStatus.PENDING:
        return 'Pending';
      case ThemeLifecycleStatus.GENERATING:
        return 'Generating';
      case ThemeLifecycleStatus.READY:
        return 'Ready';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  }
};

// ============= MIGRATION HELPERS =============
// These help migrate from old status values to new enum values

export const StatusMigration = {
  // Map old image status values to new enum
  migrateImageStatus: (oldStatus: string): ImageGenerationStatus => {
    switch (oldStatus) {
      case 'complete':
        return ImageGenerationStatus.COMPLETED;
      case 'generating':
        return ImageGenerationStatus.GENERATING;
      case 'pending':
        return ImageGenerationStatus.PENDING;
      case 'failed':
        return ImageGenerationStatus.FAILED;
      case 'none':
      default:
        return ImageGenerationStatus.NONE;
    }
  },

  // Map old processing status to new enum
  migrateProcessingStatus: (oldStatus: string): BaseProcessingStatus => {
    switch (oldStatus) {
      case 'completed':
        return BaseProcessingStatus.COMPLETED;
      case 'in_progress':
      case 'processing':
        return BaseProcessingStatus.IN_PROGRESS;
      case 'failed':
        return BaseProcessingStatus.FAILED;
      case 'not_started':
      default:
        return BaseProcessingStatus.NOT_STARTED;
    }
  },

  // Map old lifecycle status to new enum
  migrateLifecycleStatus: (oldStatus: string): ThemeLifecycleStatus => {
    switch (oldStatus) {
      case 'completed':
        return ThemeLifecycleStatus.COMPLETED;
      case 'ready':
        return ThemeLifecycleStatus.READY;
      case 'generating':
        return ThemeLifecycleStatus.GENERATING;
      case 'pending':
      default:
        return ThemeLifecycleStatus.PENDING;
    }
  }
};