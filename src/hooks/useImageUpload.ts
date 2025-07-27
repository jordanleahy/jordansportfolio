import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import type { SocialMediaPost } from '@/types/socialMedia';

export const useImageUpload = (posts: SocialMediaPost[], onPostsChange: () => void) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file916InputRef = useRef<HTMLInputElement>(null);
  const file34InputRef = useRef<HTMLInputElement>(null);
  const file43InputRef = useRef<HTMLInputElement>(null);
  
  const [uploadingPostId, setUploadingPostId] = useState<string | null>(null);
  const [uploading916PostId, setUploading916PostId] = useState<string | null>(null);
  const [uploading34PostId, setUploading34PostId] = useState<string | null>(null);
  const [uploading43PostId, setUploading43PostId] = useState<string | null>(null);
  const [uploadingGeneralVideoPostId, setUploadingGeneralVideoPostId] = useState<string | null>(null);
  
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'16_9' | '9_16' | '3_4' | '4_3'>('16_9');

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

  const handleImageUpload = useCallback(async (postId: string, file: File) => {
    setUploadingPostId(postId);
    try {
      const post = posts.find(p => p.id === postId);
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId;
      const fileName = `${baseName}_16_9_${Date.now()}.${fileExt}`;

      const publicUrl = await uploadToStorage(file, fileName);

      await optimizedSocialMediaService.updatePost(postId, {
        image_16_9_url: publicUrl
      });

      toast({
        title: "Image uploaded",
        description: "16:9 image has been successfully uploaded."
      });
      onPostsChange();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingPostId(null);
    }
  }, [posts, sanitizeTitle, uploadToStorage, onPostsChange, toast]);

  const handleImage916Upload = useCallback(async (postId: string, file: File) => {
    setUploading916PostId(postId);
    try {
      const post = posts.find(p => p.id === postId);
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId;
      const fileName = `${baseName}_9_16_${Date.now()}.${fileExt}`;

      const publicUrl = await uploadToStorage(file, fileName);

      await optimizedSocialMediaService.updatePost(postId, {
        image_9_16_url: publicUrl
      });

      toast({
        title: "Video uploaded",
        description: "9:16 video has been successfully uploaded."
      });
      onPostsChange();
    } catch (error) {
      console.error('Error uploading 9:16 image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload 9:16 video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading916PostId(null);
    }
  }, [posts, sanitizeTitle, uploadToStorage, onPostsChange, toast]);

  const handleImage34Upload = useCallback(async (postId: string, file: File) => {
    setUploading34PostId(postId);
    try {
      const post = posts.find(p => p.id === postId);
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId;
      const fileName = `${baseName}_3_4_${Date.now()}.${fileExt}`;

      const publicUrl = await uploadToStorage(file, fileName);

      await optimizedSocialMediaService.updatePost(postId, {
        image_3_4_url: publicUrl
      });

      toast({
        title: "Image uploaded",
        description: "3:4 image has been successfully uploaded."
      });
      onPostsChange();
    } catch (error) {
      console.error('Error uploading 3:4 image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload 3:4 image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading34PostId(null);
    }
  }, [posts, sanitizeTitle, uploadToStorage, onPostsChange, toast]);

  const handleImage43Upload = useCallback(async (postId: string, file: File) => {
    setUploading43PostId(postId);
    try {
      const post = posts.find(p => p.id === postId);
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId;
      const fileName = `${baseName}_4_3_${Date.now()}.${fileExt}`;

      const publicUrl = await uploadToStorage(file, fileName);

      await optimizedSocialMediaService.updatePost(postId, {
        image_4_3_url: publicUrl
      });

      toast({
        title: "Video uploaded",
        description: "4:3 video has been successfully uploaded."
      });
      onPostsChange();
    } catch (error) {
      console.error('Error uploading 4:3 image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload 4:3 video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading43PostId(null);
    }
  }, [posts, sanitizeTitle, uploadToStorage, onPostsChange, toast]);

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

  const handleFileSelect = useCallback((postId: string, event: React.ChangeEvent<HTMLInputElement>, type: '16_9' | '9_16' | '3_4' | '4_3') => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      const post = posts.find(p => p.id === postId);
      setSelectedPost(post || null);
      setSelectedFile(file);
      setUploadType(type);
    }
    
    if (event.target) {
      event.target.value = '';
    }
  }, [posts, validateFile]);

  return {
    // Refs
    fileInputRef,
    file916InputRef,
    file34InputRef,
    file43InputRef,
    
    // States
    uploadingPostId,
    uploading916PostId,
    uploading34PostId,
    uploading43PostId,
    uploadingGeneralVideoPostId,
    selectedPost,
    selectedFile,
    uploadType,
    
    // Actions
    handleImageUpload,
    handleImage916Upload,
    handleImage34Upload,
    handleImage43Upload,
    handleFileSelect,
    
    // Setters for modal management
    setSelectedPost,
    setSelectedFile,
    setUploadType
  };
};