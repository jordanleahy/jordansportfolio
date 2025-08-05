import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { AspectRatio } from '@/types/bulkImageGeneration';

// Combined processing state interface
interface ProcessingState {
  operation: 'upload' | 'generate' | 'bulk_generate';
  aspectRatio?: AspectRatio;
  isActive: boolean;
}

type ProcessingKey = string;

export function usePostStateManager(onPostsChange: () => void) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Unified state management
  const [processingStates, setProcessingStates] = useState<Map<ProcessingKey, ProcessingState>>(new Map());
  const [animatingRows, setAnimatingRows] = useState<Set<string>>(new Set());
  const [completingRows, setCompletingRows] = useState<Set<string>>(new Set());
  const [uploadingPosts, setUploadingPosts] = useState<Map<string, AspectRatio>>(new Map());
  const [creatingBlogIds, setCreatingBlogIds] = useState<Set<string>>(new Set());

  // Utility functions
  const createProcessingKey = useCallback((postId: string, operation: string, aspectRatio?: AspectRatio): ProcessingKey => {
    return aspectRatio ? `${postId}-${operation}-${aspectRatio}` : `${postId}-${operation}`;
  }, []);

  // Processing state management
  const setProcessing = useCallback((
    postId: string, 
    operation: 'upload' | 'generate' | 'bulk_generate', 
    isActive: boolean, 
    aspectRatio?: AspectRatio
  ) => {
    const key = createProcessingKey(postId, operation, aspectRatio);
    setProcessingStates(prev => {
      const newMap = new Map(prev);
      if (isActive) {
        newMap.set(key, { operation, aspectRatio, isActive });
      } else {
        newMap.delete(key);
      }
      return newMap;
    });
  }, [createProcessingKey]);

  // Check processing states
  const isProcessing = useCallback((
    postId: string, 
    operation?: 'upload' | 'generate' | 'bulk_generate', 
    aspectRatio?: AspectRatio
  ): boolean => {
    if (operation && aspectRatio) {
      const key = createProcessingKey(postId, operation, aspectRatio);
      return processingStates.get(key)?.isActive || false;
    }
    
    if (operation) {
      return Array.from(processingStates.entries()).some(([key, state]) => 
        key.startsWith(`${postId}-${operation}`) && state.isActive
      );
    }
    
    return Array.from(processingStates.entries()).some(([key, state]) => 
      key.startsWith(`${postId}-`) && state.isActive
    );
  }, [processingStates, createProcessingKey]);

  const isUploading = useCallback((postId: string, aspectRatio?: AspectRatio): boolean => {
    // Check legacy upload state
    if (uploadingPosts.has(postId)) return true;
    // Check unified processing state
    return isProcessing(postId, 'upload', aspectRatio);
  }, [uploadingPosts, isProcessing]);

  const isGenerating = useCallback((postId: string): boolean => {
    return isProcessing(postId, 'generate') || isProcessing(postId, 'bulk_generate');
  }, [isProcessing]);

  const getUploadType = useCallback((postId: string): AspectRatio | undefined => {
    // Check legacy state first
    const legacyType = uploadingPosts.get(postId);
    if (legacyType) return legacyType;
    
    // Check unified processing state
    const entry = Array.from(processingStates.entries()).find(([key, state]) => 
      key.startsWith(`${postId}-upload`) && state.isActive
    );
    return entry?.[1].aspectRatio;
  }, [uploadingPosts, processingStates]);

  // Animation management
  const handleStatusChangeWithAnimation = useCallback(async (
    postId: string,
    newStatus: 'draft' | 'scheduled' | 'published',
    originalHandler: (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => Promise<void>,
    onPostsChange: () => void
  ) => {
    if (newStatus === 'published') {
      setCompletingRows(prev => new Set(prev).add(postId));
      
      setTimeout(() => {
        setCompletingRows(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        setAnimatingRows(prev => new Set(prev).add(postId));
        
        setTimeout(() => {
          setAnimatingRows(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }, 300);
      }, 1000);
    }
    
    await originalHandler(postId, newStatus);
    onPostsChange();
  }, []);

  const getRowAnimationClass = useCallback((postId: string): string => {
    if (completingRows.has(postId)) {
      return 'animate-pulse bg-green-50 dark:bg-green-900/20';
    }
    if (animatingRows.has(postId)) {
      return 'animate-fadeOut';
    }
    return '';
  }, [completingRows, animatingRows]);

  // Post actions
  const handleStatusChange = useCallback(async (
    postId: string, 
    newStatus: 'draft' | 'scheduled' | 'published'
  ): Promise<void> => {
    const { error } = await supabase
      .from('social_media_posts')
      .update({ status: newStatus })
      .eq('id', postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Success",
      description: `Post ${newStatus === 'published' ? 'published' : 'updated'} successfully`,
    });
  }, [toast]);

  const handleCopyContent = useCallback(async (post: SocialMediaPost): Promise<void> => {
    try {
      const content = `${post.title}\n\n${post.description}`;
      await navigator.clipboard.writeText(content);
      toast({
        title: "Content copied!",
        description: "Post content has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy content to clipboard",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDeletePost = useCallback(async (postId: string): Promise<void> => {
    const { error } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
      throw error;
    }

    toast({
      title: "Success",
      description: "Post deleted successfully",
    });
    onPostsChange();
  }, [toast, onPostsChange]);

  const handleCreateBlogPost = useCallback(async (post: SocialMediaPost): Promise<void> => {
    if (!post.user_id) {
      toast({
        title: "Error",
        description: "User authentication required",
        variant: "destructive",
      });
      return;
    }

    setCreatingBlogIds(prev => new Set(prev).add(post.id));

    try {
      const { data, error } = await supabase.functions.invoke('generic-blog', {
        body: {
          postId: post.id,
          userId: post.user_id,
          title: post.title,
          description: post.description,
          category: post.category || 'general'
        }
      });

      if (error) throw error;

      if (data?.blogSlug) {
        toast({
          title: "Blog post created!",
          description: "Redirecting to your new blog post...",
        });
        navigate(`/blog/${data.blogSlug}`);
      }
    } catch (error) {
      console.error('Error creating blog post:', error);
      toast({
        title: "Error",
        description: "Failed to create blog post",
        variant: "destructive",
      });
    } finally {
      setCreatingBlogIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  }, [toast, navigate]);

  // Image management
  const handleFileSelect = useCallback(async (
    postId: string, 
    aspectRatio: AspectRatio
  ): Promise<void> => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setUploadingPosts(prev => new Map(prev).set(postId, aspectRatio));
      setProcessing(postId, 'upload', true, aspectRatio);

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${postId}_${aspectRatio}.${fileExt}`;
        const filePath = `${postId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('social_media_images')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('social_media_images')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('social_media_posts')
          .update({ [`image_${aspectRatio}`]: publicUrl })
          .eq('id', postId);

        if (updateError) throw updateError;

        // Trigger background processing
        await supabase.functions.invoke('process-uploaded-images', {
          body: { postId, aspectRatio, imageUrl: publicUrl }
        });

        onPostsChange();
        toast({
          title: "Image uploaded successfully",
          description: "Your image has been uploaded and is being processed",
        });
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setUploadingPosts(prev => {
          const newMap = new Map(prev);
          newMap.delete(postId);
          return newMap;
        });
        setProcessing(postId, 'upload', false, aspectRatio);
      }
    };

    input.click();
  }, [toast, onPostsChange, setProcessing]);

  const handleGenerateImage = useCallback(async (
    post: SocialMediaPost, 
    aspectRatio: AspectRatio
  ): Promise<void> => {
    setProcessing(post.id, 'generate', true, aspectRatio);

    try {
      // Generate prompt
      const { data: promptData, error: promptError } = await supabase.functions.invoke(
        'generate-image-prompt-dynamic',
        { body: { postId: post.id, aspectRatio } }
      );

      if (promptError) throw promptError;

      // Generate image
      const { data: imageData, error: imageError } = await supabase.functions.invoke(
        'generate-image-gpt',
        { 
          body: { 
            prompt: promptData.prompt,
            postId: post.id,
            aspectRatio: aspectRatio
          } 
        }
      );

      if (imageError) throw imageError;

      onPostsChange();
      toast({
        title: "Image generated successfully",
        description: "Your AI-generated image is ready",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(post.id, 'generate', false, aspectRatio);
    }
  }, [toast, onPostsChange, setProcessing]);

  // Computed loading states
  const loadingStates = useMemo(() => {
    const hasUploadingPosts = uploadingPosts.size > 0 || 
      Array.from(processingStates.values()).some(state => 
        state.operation === 'upload' && state.isActive
      );
    
    const hasAnimatingPosts = animatingRows.size > 0 || completingRows.size > 0;
    const hasCreatingBlogs = creatingBlogIds.size > 0;
    const hasGeneratingImages = Array.from(processingStates.values()).some(state => 
      (state.operation === 'generate' || state.operation === 'bulk_generate') && state.isActive
    );

    return {
      hasUploadingPosts,
      hasAnimatingPosts,
      hasCreatingBlogs,
      hasGeneratingImages,
      hasAnyActivity: hasUploadingPosts || hasAnimatingPosts || hasCreatingBlogs || hasGeneratingImages
    };
  }, [uploadingPosts, processingStates, animatingRows, completingRows, creatingBlogIds]);

  return {
    // State checks
    isUploading,
    isGenerating,
    isProcessing,
    getUploadType,
    
    // Loading states
    ...loadingStates,
    
    // Animation
    handleStatusChangeWithAnimation,
    getRowAnimationClass,
    animatingRows,
    completingRows,
    
    // Actions
    handleStatusChange,
    handleCopyContent,
    handleDeletePost,
    handleCreateBlogPost,
    handleFileSelect,
    handleGenerateImage,
    
    // Blog creation state
    creatingBlogIds
  };
}