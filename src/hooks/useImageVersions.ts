import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useImageVersions = (imageUrl: string, aspectRatio?: string) => {
  const [imageVersions, setImageVersions] = useState<Array<{id: string, url: string, prompt?: string, version_number: number}>>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVersionsFromDatabase = async (postId: string, currentAspectRatio: string) => {
    try {
      const { data: versions, error } = await supabase
        .from('image_versions')
        .select('*')
        .eq('post_id', postId)
        .eq('aspect_ratio', currentAspectRatio)
        .order('version_number', { ascending: true });
        
      if (error) {
        console.error('Error fetching image versions:', error);
        return;
      }
      
      const originalVersion = { id: 'original', url: imageUrl, version_number: 0 };
      
      if (versions && versions.length > 0) {
        const allVersions = [
          originalVersion,
          ...versions.map(v => ({
            id: v.id,
            url: v.edited_url,
            prompt: v.edit_prompt,
            version_number: v.version_number
          }))
        ];
        setImageVersions(allVersions);
        setCurrentVersionIndex(allVersions.length - 1);
      } else {
        setImageVersions([originalVersion]);
        setCurrentVersionIndex(0);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      setImageVersions([{ id: 'original', url: imageUrl, version_number: 0 }]);
      setCurrentVersionIndex(0);
    }
  };

  useEffect(() => {
    const initializeVersions = async () => {
      const urlMatch = imageUrl.match(/generated_([a-f0-9-]+)_/) || 
                       imageUrl.match(/([a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{12})/);
      const postId = urlMatch?.[1];
      
      if (postId) {
        await fetchVersionsFromDatabase(postId, aspectRatio || '1:1');
      } else {
        setImageVersions([{ id: 'original', url: imageUrl, version_number: 0 }]);
        setCurrentVersionIndex(0);
      }
    };
    
    initializeVersions();
  }, [imageUrl, aspectRatio]);

  const currentImageUrl = imageVersions[currentVersionIndex]?.url || imageUrl;

  const goToNextVersion = useCallback(() => {
    if (currentVersionIndex < imageVersions.length - 1) {
      setCurrentVersionIndex(currentVersionIndex + 1);
    }
  }, [currentVersionIndex, imageVersions.length]);

  const goToPreviousVersion = useCallback(() => {
    if (currentVersionIndex > 0) {
      setCurrentVersionIndex(currentVersionIndex - 1);
    }
  }, [currentVersionIndex]);

  const goToVersion = useCallback((index: number) => {
    if (index >= 0 && index < imageVersions.length) {
      setIsLoading(true);
      setCurrentVersionIndex(index);
      // Simulate loading delay for smooth transition
      setTimeout(() => setIsLoading(false), 150);
    }
  }, [imageVersions.length]);

  return {
    imageVersions,
    currentVersionIndex,
    setCurrentVersionIndex,
    currentImageUrl,
    fetchVersionsFromDatabase,
    goToNextVersion,
    goToPreviousVersion,
    goToVersion,
    isLoading,
    hasMultipleVersions: imageVersions.length > 1
  };
};