import { useState, useMemo } from 'react';
import { useDebouncedCallback } from './useDebouncedCallback';
import type { SocialMediaPost } from '@/types/socialMedia';

interface Theme {
  id: string;
  theme_name: string;
  theme_description: string;
  category: string;
}

interface UseOptimizedSearchProps {
  themes: Theme[];
  posts: SocialMediaPost[];
  debounceMs?: number;
}

export const useOptimizedSearch = ({ 
  themes, 
  posts, 
  debounceMs = 300 
}: UseOptimizedSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounced search to avoid excessive filtering
  const updateDebouncedQuery = useDebouncedCallback((query: string) => {
    setDebouncedQuery(query);
  }, debounceMs);

  // Update search and trigger debounced update
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateDebouncedQuery(query);
  };

  // Memoized filtered results
  const filteredData = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return { themes, posts };
    }

    const lowerQuery = debouncedQuery.toLowerCase();

    const filteredThemes = themes.filter(theme => 
      theme.theme_name.toLowerCase().includes(lowerQuery) ||
      theme.theme_description.toLowerCase().includes(lowerQuery) ||
      theme.category.toLowerCase().includes(lowerQuery)
    );

    const filteredThemeIds = new Set(filteredThemes.map(t => t.id));

    const filteredPosts = posts.filter(post => 
      filteredThemeIds.has(post.theme_id) ||
      post.title.toLowerCase().includes(lowerQuery) ||
      post.description.toLowerCase().includes(lowerQuery)
    );

    return {
      themes: filteredThemes,
      posts: filteredPosts
    };
  }, [themes, posts, debouncedQuery]);

  return {
    searchQuery,
    handleSearchChange,
    filteredThemes: filteredData.themes,
    filteredPosts: filteredData.posts,
    isSearching: searchQuery !== debouncedQuery,
  };
};