import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { SocialMediaPost } from '@/types/socialMedia';

interface UseImageUploadProps {
  onPostsChange: () => void;
}

interface UseImageUploadReturn {
  uploadingPosts: Record<string, Record<string, boolean>>;
  handleFileSelect: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', post: SocialMediaPost) => void;
  isUploading: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3') => boolean;
  getUploadType: (postId: string) => '16_9' | '9_16' | '3_4' | '4_3' | null;
}

export const useImageUpload = ({ onPostsChange }: UseImageUploadProps): UseImageUploadReturn => {
  const [uploadingPosts, setUploadingPosts] = useState<Record<string, Record<string, boolean>>>({});

  // Debounced version of onPostsChange to prevent rapid refetches
  const debouncedOnPostsChange = useDebouncedCallback(onPostsChange, 200);

  const sanitizeTitle = useCallback((title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }, []);

  const uploadToStorage = async (file: File): Promise<string | null> => {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExt}`;
    const filePath = `general/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading to storage:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const triggerBackgroundProcessing = async (imageUrl: string, postId: string, aspectRatio: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-uploaded-images', {
        body: {
          imageUrl,
          postId,
          aspectRatio,
          watermarkText: 'www.jordanleahy.com'
        }
      });

      if (error) {
        console.error('Background processing failed:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to trigger background processing:', error);
      // Update status to failed
      const statusField = `image_${aspectRatio}_status`;
      await supabase
        .from('social_media_posts')
        .update({ [statusField]: 'failed' })
        .eq('id', postId);
      
      throw error;
    }
  };

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please select an image smaller than 5MB.');
      return false;
    }

    return true;
  };

  const handleFileSelect = async (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', post: SocialMediaPost) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        if (!validateFile(file)) return;
        
        try {
          // Update uploading state
          setUploadingPosts(prev => ({
            ...prev,
            [postId]: { ...prev[postId], [aspectRatio]: true }
          }));

          // Update status to uploading
          const statusField = `image_${aspectRatio}_status`;
          await supabase
            .from('social_media_posts')
            .update({ [statusField]: 'uploading' })
            .eq('id', postId);

          // Upload original image immediately
          const imageUrl = await uploadToStorage(file);
          if (!imageUrl) {
            throw new Error('Failed to upload image');
          }

          // Update database with original image URL and set status to processing
          const imageUrlField = `image_${aspectRatio}_url`;
          await supabase
            .from('social_media_posts')
            .update({ 
              [imageUrlField]: imageUrl,
              [statusField]: 'processing'
            })
            .eq('id', postId);

          toast.success('Image uploaded! Processing watermark in background...');
          debouncedOnPostsChange();

          // Trigger background processing
          await triggerBackgroundProcessing(imageUrl, postId, aspectRatio);

        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image');
          
          // Update status to failed
          const statusField = `image_${aspectRatio}_status`;
          await supabase
            .from('social_media_posts')
            .update({ [statusField]: 'failed' })
            .eq('id', postId);
        } finally {
          // Clear uploading state
          setUploadingPosts(prev => ({
            ...prev,
            [postId]: { ...prev[postId], [aspectRatio]: false }
          }));
        }
      }
    };
    
    input.click();
  };

  const isUploading = (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3'): boolean => {
    return uploadingPosts[postId]?.[aspectRatio] || false;
  };

  const getUploadType = (postId: string): '16_9' | '9_16' | '3_4' | '4_3' | null => {
    const postUploads = uploadingPosts[postId];
    if (!postUploads) return null;
    
    for (const aspectRatio of ['16_9', '9_16', '3_4', '4_3'] as const) {
      if (postUploads[aspectRatio]) {
        return aspectRatio;
      }
    }
    return null;
  };

  return {
    uploadingPosts,
    handleFileSelect,
    isUploading,
    getUploadType,
  };
};