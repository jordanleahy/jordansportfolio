// This hook has been disabled and replaced by useUnifiedRealtime
// Keeping it for reference but it should not be used anymore

export const useRealtimeColorThemes = () => {
  console.warn('useRealtimeColorThemes is disabled - use useUnifiedRealtime instead');
  return {
    lastUpdate: null,
    clearLastUpdate: () => {}
  };
};
