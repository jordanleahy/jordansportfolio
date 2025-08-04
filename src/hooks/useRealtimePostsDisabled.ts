// This hook has been disabled and replaced by useUnifiedRealtime
// Keeping it for reference but it should not be used anymore

export const useRealtimePosts = () => {
  console.warn('useRealtimePosts is disabled - use useUnifiedRealtime instead');
  return {
    isSubscribed: false,
    channel: null,
    logs: [],
    metrics: {},
    sessionId: '',
    clearLogs: () => {},
    exportLogs: () => ({}),
  };
};
