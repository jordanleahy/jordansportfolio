import { useState, useCallback, useMemo } from 'react';
import { useImageVersions } from './useImageVersions';

interface SelectedImageVersion {
  postId: string;
  selectedUrl: string;
}

export const useSelectedImageVersions = (posts: Array<{ id: string; image_1_1_url?: string | null }>) => {
  // Track selected image URLs for each post
  const [selectedVersions, setSelectedVersions] = useState<Map<string, string>>(new Map());

  // Update selected version for a specific post
  const updateSelectedVersion = useCallback((postId: string, imageUrl: string) => {
    setSelectedVersions(prev => {
      const newMap = new Map(prev);
      newMap.set(postId, imageUrl);
      return newMap;
    });
  }, []);

  // Get selected version for a specific post (or default to original)
  const getSelectedVersion = useCallback((postId: string, defaultUrl?: string | null) => {
    return selectedVersions.get(postId) || defaultUrl || null;
  }, [selectedVersions]);

  // Get all selected versions as a record for API calls
  const getSelectedVersionsRecord = useCallback(() => {
    const record: Record<string, string> = {};
    posts.forEach(post => {
      const selectedUrl = getSelectedVersion(post.id, post.image_1_1_url);
      if (selectedUrl) {
        record[post.id] = selectedUrl;
      }
    });
    return record;
  }, [posts, getSelectedVersion]);

  // Reset selections
  const resetSelections = useCallback(() => {
    setSelectedVersions(new Map());
  }, []);

  // Check if a post has a non-default version selected
  const hasCustomSelection = useCallback((postId: string, defaultUrl?: string | null) => {
    const selectedUrl = selectedVersions.get(postId);
    return selectedUrl && selectedUrl !== defaultUrl;
  }, [selectedVersions]);

  return {
    updateSelectedVersion,
    getSelectedVersion,
    getSelectedVersionsRecord,
    resetSelections,
    hasCustomSelection,
    selectedVersionsCount: selectedVersions.size
  };
};