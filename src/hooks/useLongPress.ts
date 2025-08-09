import { useCallback, useRef } from 'react';

interface LongPressOptions {
  threshold?: number; // Duration in ms
  onLongPress: (coordinates: { x: number; y: number }) => void;
  onPress?: () => void;
  onRelease?: () => void;
}

export function useLongPress({ 
  threshold = 600, 
  onLongPress, 
  onPress, 
  onRelease 
}: LongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pressedRef = useRef(false);
  const coordinatesRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    // Get coordinates from either touch or mouse event
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    coordinatesRef.current = { x: clientX, y: clientY };
    pressedRef.current = true;
    
    // Trigger haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onPress?.();
    
    timeoutRef.current = setTimeout(() => {
      if (pressedRef.current) {
        onLongPress(coordinatesRef.current);
        // Additional haptic feedback for long press
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]);
        }
      }
    }, threshold);
  }, [threshold, onLongPress, onPress]);

  const end = useCallback(() => {
    pressedRef.current = false;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    onRelease?.();
  }, [onRelease]);

  const cancel = useCallback(() => {
    pressedRef.current = false;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: end,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
  };
}