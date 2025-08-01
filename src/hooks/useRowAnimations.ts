import { useState } from 'react';

interface UseRowAnimationsReturn {
  animatingRows: Set<string>;
  completingRows: Set<string>;
  handleStatusChangeWithAnimation: (
    postId: string, 
    newStatus: 'draft' | 'scheduled' | 'published', 
    originalHandler: (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => Promise<void>,
    onPostsChange: () => void
  ) => Promise<void>;
  getRowAnimationClass: (postId: string) => string;
}

export const useRowAnimations = (): UseRowAnimationsReturn => {
  const [animatingRows, setAnimatingRows] = useState<Set<string>>(new Set());
  const [completingRows, setCompletingRows] = useState<Set<string>>(new Set());

  const handleStatusChangeWithAnimation = async (
    postId: string,
    newStatus: 'draft' | 'scheduled' | 'published',
    originalHandler: (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => Promise<void>,
    onPostsChange: () => void
  ) => {
    // If changing from draft to published, trigger the animation
    if (newStatus === 'published') {
      // Step 1: Show completion state (green)
      setCompletingRows(prev => new Set([...prev, postId]));
      
      // Step 2: Execute the actual status change
      await originalHandler(postId, newStatus);
      
      // Step 3: After a brief delay, start the exit animation
      setTimeout(() => {
        setCompletingRows(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        
        setAnimatingRows(prev => new Set([...prev, postId]));
        
        // Step 4: Clean up after animation completes
        setTimeout(() => {
          setAnimatingRows(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
          
          // Refresh the posts to remove from current view
          onPostsChange();
        }, 600); // Animation duration
      }, 800); // Brief delay to show green state
    } else {
      // For other status changes, just execute normally
      await originalHandler(postId, newStatus);
    }
  };

  const getRowAnimationClass = (postId: string): string => {
    if (completingRows.has(postId)) {
      return 'animate-pulse bg-green-50 border-green-200';
    }
    if (animatingRows.has(postId)) {
      return 'animate-slide-out-right opacity-0 transform translate-x-full transition-all duration-500 ease-in-out';
    }
    return '';
  };

  return {
    animatingRows,
    completingRows,
    handleStatusChangeWithAnimation,
    getRowAnimationClass
  };
};