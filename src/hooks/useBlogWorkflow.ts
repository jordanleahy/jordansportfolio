import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { unifiedBlogService } from '@/services/unifiedBlogService';
import { BlogPost, BlogPostInput } from '@/types/simplifiedBlog';
import { toast } from 'sonner';

interface BlogStatus {
  exists: boolean;
  status?: 'draft' | 'published';
  id?: string;
  slug?: string;
  isLoading: boolean;
}

// Consolidated blog workflow hook
export const useBlogWorkflow = (postId?: string) => {
  const queryClient = useQueryClient();

  // Blog status check
  const {
    data: blogStatus,
    isLoading: isCheckingStatus,
    error: statusError
  } = useQuery({
    queryKey: ['blog-status', postId],
    queryFn: async () => {
      if (!postId) return { exists: false, isLoading: false };

      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, status')
        .eq('social_media_post_id', postId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return {
        exists: !!data,
        status: data?.status as 'draft' | 'published' | undefined,
        id: data?.id,
        slug: data?.slug,
        isLoading: false,
      };
    },
    enabled: !!postId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch single blog post
  const fetchBlogPost = useQuery({
    queryKey: ['blog-post', postId],
    queryFn: async () => {
      if (!postId) return null;
      return await unifiedBlogService.getPost(postId, true);
    },
    enabled: !!postId,
    staleTime: 5 * 60 * 1000,
  });

  // Create blog post mutation
  const createBlogMutation = useMutation({
    mutationFn: async (socialMediaPost: any) => {
      return await unifiedBlogService.generateFromSocialPost(socialMediaPost);
    },
    onSuccess: (data) => {
      toast.success('Blog post created successfully');
      queryClient.invalidateQueries({ queryKey: ['blog-status'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error: any) => {
      console.error('Blog creation error:', error);
      toast.error(error.message || 'Failed to create blog post');
    },
  });

  // Update blog post mutation
  const updateBlogMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BlogPostInput> }) => {
      // Ensure required fields for database compatibility
      const completeData = {
        ...data,
        tldr_title: data.tldr_title || 'TL;DR',
        share_enabled: data.share_enabled ?? true,
        featured: data.featured ?? false,
        category: data.category || 'healthcare',
        cta_text: data.cta_text || 'Learn more',
        meta_title: data.meta_title || data.hero_headline || '',
        meta_description: data.meta_description || data.hero_subhead || '',
        status: data.status || 'draft'
      } as BlogPostInput;
      
      return await unifiedBlogService.savePost(completeData, id);
    },
    onSuccess: () => {
      toast.success('Blog post updated successfully');
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error: any) => {
      console.error('Blog update error:', error);
      toast.error(error.message || 'Failed to update blog post');
    },
  });

  // Delete blog post mutation
  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      return await unifiedBlogService.deletePost(id);
    },
    onSuccess: () => {
      toast.success('Blog post deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['blog-status'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error: any) => {
      console.error('Blog deletion error:', error);
      toast.error(error.message || 'Failed to delete blog post');
    },
  });

  return {
    // Status
    blogStatus: blogStatus || { exists: false, isLoading: isCheckingStatus },
    isCheckingStatus,
    statusError,

    // Blog post data
    blogPost: fetchBlogPost.data,
    isFetchingPost: fetchBlogPost.isLoading,
    fetchError: fetchBlogPost.error,

    // Actions
    createBlog: createBlogMutation.mutate,
    updateBlog: updateBlogMutation.mutate,
    deleteBlog: deleteBlogMutation.mutate,

    // Loading states
    isCreating: createBlogMutation.isPending,
    isUpdating: updateBlogMutation.isPending,
    isDeleting: deleteBlogMutation.isPending,

    // Combined loading state
    isLoading: isCheckingStatus || createBlogMutation.isPending || updateBlogMutation.isPending || deleteBlogMutation.isPending,
  };
};