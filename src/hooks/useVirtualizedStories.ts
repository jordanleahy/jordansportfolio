import { useMemo } from 'react';
import type { ThemeWithPosts } from '@/types/stories';

interface UseVirtualizedStoriesProps {
  themes: ThemeWithPosts[];
  containerRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
}

interface VirtualItem {
  index: number;
  theme: ThemeWithPosts;
  key: string;
  size: number;
  start: number;
}

export const useVirtualizedStories = ({ 
  themes, 
  containerRef, 
  enabled = true 
}: UseVirtualizedStoriesProps) => {
  // For now, just return regular items without complex virtualization
  // to avoid build issues. Can enhance later with proper virtual scrolling.
  const virtualItems: VirtualItem[] = useMemo(() => {
    return themes.map((theme, index) => ({
      index,
      theme,
      key: theme.id || `theme-${index}`,
      size: 300,
      start: index * 300,
    }));
  }, [themes]);

  return {
    virtualItems,
    totalSize: themes.length * 300,
    isVirtualized: false, // Disable virtualization for now
  };
};