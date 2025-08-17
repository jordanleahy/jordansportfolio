import { useCallback, useState, RefObject } from 'react';

interface UseScrollToElementOptions {
  // Target configuration
  targetSelector?: string;
  targetRef?: RefObject<HTMLElement>;
  
  // Scroll behavior
  behavior?: 'smooth' | 'instant' | 'auto';
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
  offset?: number;
  
  // Timing and safety
  delay?: number;
  retryAttempts?: number;
  retryDelay?: number;
  respectMotionPreferences?: boolean;
  
  // Callbacks
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onElementNotFound?: () => void;
}

interface UseScrollToElementReturn {
  scrollToElement: () => void;
  isScrolling: boolean;
  error: string | null;
}

export const useScrollToElement = (
  options: UseScrollToElementOptions = {}
): UseScrollToElementReturn => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    targetSelector,
    targetRef,
    behavior = 'smooth',
    block = 'center',
    inline = 'nearest',
    offset = 0,
    delay = 200,
    retryAttempts = 3,
    retryDelay = 100,
    respectMotionPreferences = true,
    onSuccess,
    onError,
    onElementNotFound,
  } = options;

  const findTargetElement = useCallback((): HTMLElement | null => {
    // Try ref first
    if (targetRef?.current) {
      return targetRef.current;
    }

    // Then try selector
    if (targetSelector) {
      return document.querySelector(targetSelector) as HTMLElement;
    }

    return null;
  }, [targetRef, targetSelector]);

  const performScroll = useCallback((element: HTMLElement) => {
    // Respect user's motion preferences
    const prefersReducedMotion = respectMotionPreferences && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const scrollBehavior = prefersReducedMotion ? 'instant' : behavior;

    try {
      // Apply offset if specified
      if (offset !== 0) {
        const elementRect = element.getBoundingClientRect();
        const targetY = window.scrollY + elementRect.top + offset;
        
        window.scrollTo({
          top: targetY,
          behavior: scrollBehavior,
        });
      } else {
        element.scrollIntoView({
          behavior: scrollBehavior,
          block,
          inline,
        });
      }

      // Verify element is in view using intersection observer
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            setIsScrolling(false);
            setError(null);
            onSuccess?.();
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(element);

      // Fallback: stop scrolling state after animation duration
      setTimeout(() => {
        setIsScrolling(false);
        observer.disconnect();
      }, scrollBehavior === 'smooth' ? 1000 : 100);

    } catch (scrollError) {
      const errorMessage = scrollError instanceof Error ? scrollError.message : 'Scroll failed';
      setError(errorMessage);
      setIsScrolling(false);
      onError?.(errorMessage);
    }
  }, [behavior, block, inline, offset, respectMotionPreferences, onSuccess, onError]);

  const attemptScroll = useCallback(async (attempt: number = 1): Promise<void> => {
    const element = findTargetElement();

    if (element) {
      performScroll(element);
      return;
    }

    // Element not found - retry if attempts remaining
    if (attempt < retryAttempts) {
      setTimeout(() => {
        attemptScroll(attempt + 1);
      }, retryDelay);
      return;
    }

    // All retry attempts exhausted
    const errorMessage = `Element not found after ${retryAttempts} attempts`;
    setError(errorMessage);
    setIsScrolling(false);
    onElementNotFound?.();
    onError?.(errorMessage);
  }, [findTargetElement, performScroll, retryAttempts, retryDelay, onElementNotFound, onError]);

  const scrollToElement = useCallback(() => {
    if (isScrolling) return; // Prevent concurrent scroll operations

    setIsScrolling(true);
    setError(null);

    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      if (delay > 0) {
        setTimeout(() => {
          attemptScroll();
        }, delay);
      } else {
        attemptScroll();
      }
    });
  }, [isScrolling, delay, attemptScroll]);

  return {
    scrollToElement,
    isScrolling,
    error,
  };
};