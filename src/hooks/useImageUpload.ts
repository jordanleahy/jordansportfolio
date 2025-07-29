import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useDebouncedCallback } from 'use-debounce';
import type { SocialMediaPost } from '@/types/socialMedia';

type AspectRatio = '16_9' | '9_16' | '3_4' | '4_3';

export const useImageUpload = (onPostsChange: () => void) => {
  const { toast } = useToast();
  
  // Simplified state management
  const [uploadingPosts, setUploadingPosts] = useState<Record<string, AspectRatio | null>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<AspectRatio>('16_9');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Single file input ref for all uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debounced version of onPostsChange to prevent rapid refetches
  const debouncedOnPostsChange = useDebouncedCallback(onPostsChange, 200);

  const sanitizeTitle = useCallback((title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }, []);

  const uploadToStorage = useCallback(async (file: File, fileName: string) => {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return publicUrl;
  }, []);

  // Unified upload handler for all aspect ratios
  const handleUpload = useCallback(async (postId: string, file: File, aspectRatio: AspectRatio, post?: SocialMediaPost) => {
    setUploadingPosts(prev => ({ ...prev, [postId]: aspectRatio }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId;
      const fileName = `${baseName}_${aspectRatio}_${Date.now()}.${fileExt}`;

      const publicUrl = await uploadToStorage(file, fileName);

      // Map aspect ratio to database field
      const fieldMap = {
        '16_9': 'image_16_9_url',
        '9_16': 'image_9_16_url',
        '3_4': 'image_3_4_url',
        '4_3': 'image_4_3_url'
      };

      await optimizedSocialMediaService.updatePost(postId, {
        [fieldMap[aspectRatio]]: publicUrl
      });

      const aspectRatioLabels = {
        '16_9': '16:9',
        '9_16': '9:16',
        '3_4': '3:4',
        '4_3': '4:3'
      };

      toast({
        title: "Image uploaded",
        description: `${aspectRatioLabels[aspectRatio]} image has been successfully uploaded.`
      });
      
      debouncedOnPostsChange();
    } catch (error) {
      console.error('Error uploading image:', error);
      
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingPosts(prev => ({ ...prev, [postId]: null }));
    }
  }, [sanitizeTitle, uploadToStorage, debouncedOnPostsChange, toast]);

  const validateFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  }, [toast]);

  // Simplified file selection handler
  const handleFileSelect = useCallback((postId: string, aspectRatio: AspectRatio, post?: SocialMediaPost) => {
    setSelectedPostId(postId);
    setUploadType(aspectRatio);
    
    // Create and trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && validateFile(file)) {
        setSelectedFile(file);
        // For now, skip watermark and upload directly
        // Later we can add watermark modal trigger here
        handleUpload(postId, file, aspectRatio, post);
      }
    };
    input.click();
  }, [validateFile, handleUpload]);

  // Helper to check if a specific post is uploading
  const isUploading = useCallback((postId: string, aspectRatio?: AspectRatio) => {
    if (aspectRatio) {
      return uploadingPosts[postId] === aspectRatio;
    }
    return uploadingPosts[postId] !== null && uploadingPosts[postId] !== undefined;
  }, [uploadingPosts]);

  // Get upload type for a specific post
  const getUploadType = useCallback((postId: string) => {
    return uploadingPosts[postId];
  }, [uploadingPosts]);

  return {
    // Single file input ref
    fileInputRef,
    
    // Simplified state
    uploadingPosts,
    selectedFile,
    uploadType,
    selectedPostId,
    
    // Actions
    handleUpload,
    handleFileSelect,
    isUploading,
    getUploadType,
    
    // Setters for modal management
    setSelectedFile,
    setUploadType,
    setSelectedPostId
  };
};