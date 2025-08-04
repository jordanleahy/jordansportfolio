// This hook has been disabled and replaced by useUnifiedRealtime
// Keeping it for reference but it should not be used anymore

export const useRealtimeSystemPrompts = () => {
  console.warn('useRealtimeSystemPrompts is disabled - use useUnifiedRealtime instead');
  return {
    isConnected: false,
    userId: null
  };
};
