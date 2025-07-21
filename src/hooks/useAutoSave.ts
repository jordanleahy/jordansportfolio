
import { useCallback, useRef, useEffect } from 'react';
import { useUpdateBlogPost } from '@/hooks/useBlogQueries';
import { BlogPostInput } from '@/types/blog';

interface AutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  onAutoSave?: (status: 'saving' | 'saved' | 'error') => void;
}

export const useAutoSave = (
  postId: string | undefined,
  formData: BlogPostInput,
  options: AutoSaveOptions = {}
) => {
  const { delay = 3000, enabled = true, onAutoSave } = options;
  const updateMutation = useUpdateBlogPost();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Silent auto-save function - no validation, no toasts, no navigation
  const performAutoSave = useCallback(async (data: BlogPostInput) => {
    if (!postId || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      onAutoSave?.('saving');

      // Create minimal update data for auto-save
      const autoSaveData = {
        hero_headline: data.hero_headline || '',
        hero_subhead: data.hero_subhead || '',
        intro_content: data.intro_content || '',
        visual_sections: data.visual_sections,
        tldr_title: data.tldr_title,
        tldr_bullets: data.tldr_bullets,
        deep_dive_title: data.deep_dive_title,
        deep_dive_content: data.deep_dive_content,
        cta_text: data.cta_text || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        category: data.category || '',
        status: 'draft' as const
      };

      await updateMutation.mutateAsync({
        id: postId,
        data: autoSaveData
      });

      onAutoSave?.('saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      onAutoSave?.('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [postId, updateMutation, onAutoSave]);

  // Debounced auto-save trigger
  const triggerAutoSave = useCallback((data: BlogPostInput) => {
    if (!enabled || !postId) return;

    // Check if data actually changed
    const currentDataHash = JSON.stringify(data);
    if (currentDataHash === lastSavedRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      lastSavedRef.current = currentDataHash;
      performAutoSave(data);
    }, delay);
  }, [enabled, postId, delay, performAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    triggerAutoSave,
    isAutoSaving: isSavingRef.current
  };
};
