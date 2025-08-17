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
    console.log('🔍 SCROLL: Searching for target element', { targetRef: !!targetRef?.current, targetSelector });
    
    // Try ref first
    if (targetRef?.current) {
      console.log('✅ SCROLL: Element found via ref', targetRef.current);
      return targetRef.current;
    }

    // Then try selector
    if (targetSelector) {
      const element = document.querySelector(targetSelector) as HTMLElement;
      if (element) {
        console.log('✅ SCROLL: Element found via selector', { element, selector: targetSelector });
        console.log('📍 SCROLL: Element position', {
          offsetTop: element.offsetTop,
          scrollTop: element.scrollTop,
          clientHeight: element.clientHeight,
          rect: element.getBoundingClientRect()
        });
      } else {
        console.log('❌ SCROLL: Element not found with selector', targetSelector);
        console.log('🔍 SCROLL: Available elements with data-theme-state:', 
          document.querySelectorAll('[data-theme-state]'));
      }
      return element;
    }

    console.log('⚠️ SCROLL: No target ref or selector provided');
    return null;
  }, [targetRef, targetSelector]);

  const performScroll = useCallback((element: HTMLElement) => {
    console.log('🚀 SCROLL: Starting scroll operation', { element, behavior, block, inline, offset });
    
    // Respect user's motion preferences
    const prefersReducedMotion = respectMotionPreferences && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const scrollBehavior = prefersReducedMotion ? 'instant' : behavior;
    console.log('📱 SCROLL: Motion preferences check', { 
      prefersReducedMotion, 
      finalBehavior: scrollBehavior,
      respectMotionPreferences 
    });

    // Log current viewport state
    console.log('📐 SCROLL: Current viewport state', {
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight
    });

    try {
      // Apply offset if specified
      if (offset !== 0) {
        console.log('📏 SCROLL: Applying offset scroll', { offset });
        const elementRect = element.getBoundingClientRect();
        const targetY = window.scrollY + elementRect.top + offset;
        
        console.log('🎯 SCROLL: Calculating target position', {
          currentScrollY: window.scrollY,
          elementTop: elementRect.top,
          offset,
          targetY
        });
        
        window.scrollTo({
          top: targetY,
          behavior: scrollBehavior,
        });
      } else {
        console.log('🎯 SCROLL: Using scrollIntoView', {
          behavior: scrollBehavior,
          block,
          inline
        });
        
        element.scrollIntoView({
          behavior: scrollBehavior,
          block,
          inline,
        });
      }

      console.log('👀 SCROLL: Setting up intersection observer');
      
      // Verify element is in view using intersection observer
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          console.log('🔄 SCROLL: Intersection observer callback', {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: entry.boundingClientRect
          });
          
          if (entry.isIntersecting) {
            console.log('✨ SCROLL: Element is now visible in viewport');
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
      const fallbackTimeout = scrollBehavior === 'smooth' ? 1000 : 100;
      console.log('⏰ SCROLL: Setting fallback timeout', { timeout: fallbackTimeout });
      
      setTimeout(() => {
        console.log('⏰ SCROLL: Fallback timeout triggered - stopping scroll state');
        setIsScrolling(false);
        observer.disconnect();
      }, fallbackTimeout);

    } catch (scrollError) {
      const errorMessage = scrollError instanceof Error ? scrollError.message : 'Scroll failed';
      console.log('🐛 SCROLL: Scroll operation failed', { error: errorMessage, scrollError });
      setError(errorMessage);
      setIsScrolling(false);
      onError?.(errorMessage);
    }
  }, [behavior, block, inline, offset, respectMotionPreferences, onSuccess, onError]);

  const attemptScroll = useCallback(async (attempt: number = 1): Promise<void> => {
    console.log(`🔄 SCROLL: Attempting scroll (${attempt}/${retryAttempts})`);
    const element = findTargetElement();

    if (element) {
      console.log('✅ SCROLL: Element found - proceeding with scroll');
      performScroll(element);
      return;
    }

    // Element not found - retry if attempts remaining
    if (attempt < retryAttempts) {
      console.log(`❌ SCROLL: Element not found (attempt ${attempt}/${retryAttempts}) - retrying in ${retryDelay}ms`);
      setTimeout(() => {
        attemptScroll(attempt + 1);
      }, retryDelay);
      return;
    }

    // All retry attempts exhausted
    const errorMessage = `Element not found after ${retryAttempts} attempts`;
    console.log('⚠️ SCROLL: All retry attempts exhausted', { 
      attempts: retryAttempts, 
      targetSelector, 
      error: errorMessage 
    });
    setError(errorMessage);
    setIsScrolling(false);
    onElementNotFound?.();
    onError?.(errorMessage);
  }, [findTargetElement, performScroll, retryAttempts, retryDelay, onElementNotFound, onError, targetSelector]);

  const scrollToElement = useCallback(() => {
    if (isScrolling) {
      console.log('⚠️ SCROLL: Scroll already in progress - preventing concurrent operation');
      return; // Prevent concurrent scroll operations
    }

    console.log('🎯 SCROLL: Starting scroll operation', {
      targetSelector,
      targetRef: !!targetRef?.current,
      behavior,
      block,
      inline,
      offset,
      delay,
      retryAttempts
    });

    setIsScrolling(true);
    setError(null);

    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      console.log('🔄 SCROLL: DOM update frame complete, proceeding with scroll');
      
      if (delay > 0) {
        console.log(`⏳ SCROLL: Waiting ${delay}ms before scroll attempt`);
        setTimeout(() => {
          attemptScroll();
        }, delay);
      } else {
        console.log('🚀 SCROLL: Immediate scroll attempt');
        attemptScroll();
      }
    });
  }, [isScrolling, delay, attemptScroll, targetSelector, targetRef, behavior, block, inline, offset, retryAttempts]);

  return {
    scrollToElement,
    isScrolling,
    error,
  };
};