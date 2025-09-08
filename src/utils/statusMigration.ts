// Utility to migrate between old and new status values
// This ensures backward compatibility during the transition

export const StatusMigration = {
  // Convert old 'complete' to new 'completed' for images
  normalizeImageStatus: (status: string | null): string => {
    if (!status) return 'none';
    return status === 'complete' ? 'completed' : status;
  },

  // Check if status indicates completion (handles both old and new values)
  isCompleted: (status: string): boolean => {
    return status === 'completed' || status === 'complete';
  },

  // Check if status indicates processing/generating
  isProcessing: (status: string): boolean => {
    return status === 'generating' || status === 'in_progress' || status === 'processing';
  },

  // Check if status indicates not started  
  isNotStarted: (status: string): boolean => {
    return status === 'not_started' || status === 'none' || status === 'pending';
  },

  // Get unified status display label
  getDisplayLabel: (status: string): string => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
      case 'processing':
        return 'In Progress';
      case 'completed':
      case 'complete':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'generating':
        return 'Generating';
      case 'pending':
        return 'Pending';
      case 'none':
        return 'None';
      case 'draft':
        return 'Draft';
      case 'published':
        return 'Published';
      case 'scheduled':
        return 'Scheduled';
      case 'ready':
        return 'Ready';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  }
};