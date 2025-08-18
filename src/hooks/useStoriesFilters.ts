import { useState, useMemo, useEffect } from 'react';
import { ThemeWithPosts } from '@/types/stories';

interface UseStoriesFiltersProps {
  themes: ThemeWithPosts[];
}

interface UseStoriesFiltersReturn {
  filteredThemes: ThemeWithPosts[];
  selectedCategories: Set<string>;
  searchQuery: string;
  availableCategories: Array<{ name: string; count: number }>;
  setSelectedCategories: (categories: Set<string>) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  selectAllCategories: () => void;
  hasActiveFilters: boolean;
}

export function useStoriesFilters({ themes }: UseStoriesFiltersProps): UseStoriesFiltersReturn {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories with counts
  const availableCategories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    themes.forEach(theme => {
      const count = categoryMap.get(theme.category) || 0;
      categoryMap.set(theme.category, count + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [themes]);

  // Filter themes based on selected categories and search query
  const filteredThemes = useMemo(() => {
    let filtered = themes;

    // Filter by selected categories
    if (selectedCategories.size > 0) {
      filtered = filtered.filter(theme => selectedCategories.has(theme.category));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(theme => 
        theme.theme_name.toLowerCase().includes(query) ||
        (theme.description && theme.description.toLowerCase().includes(query)) ||
        theme.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [themes, selectedCategories, searchQuery]);

  // Check if any filters are active
  const hasActiveFilters = selectedCategories.size > 0 || searchQuery.trim().length > 0;

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories(new Set());
    setSearchQuery('');
  };

  // Select all categories
  const selectAllCategories = () => {
    const allCategories = new Set(availableCategories.map(cat => cat.name));
    setSelectedCategories(allCategories);
  };

  // Persist filter state in sessionStorage
  useEffect(() => {
    try {
      const filterState = {
        selectedCategories: Array.from(selectedCategories),
        searchQuery
      };
      sessionStorage.setItem('stories-filters', JSON.stringify(filterState));
    } catch (error) {
      console.warn('Failed to persist filter state:', error);
    }
  }, [selectedCategories, searchQuery]);

  // Restore filter state from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('stories-filters');
      if (stored) {
        const { selectedCategories: storedCategories, searchQuery: storedQuery } = JSON.parse(stored);
        if (storedCategories) {
          setSelectedCategories(new Set(storedCategories));
        }
        if (storedQuery) {
          setSearchQuery(storedQuery);
        }
      }
    } catch (error) {
      console.warn('Failed to restore filter state:', error);
    }
  }, []);

  return {
    filteredThemes,
    selectedCategories,
    searchQuery,
    availableCategories,
    setSelectedCategories,
    setSearchQuery,
    clearFilters,
    selectAllCategories,
    hasActiveFilters
  };
}