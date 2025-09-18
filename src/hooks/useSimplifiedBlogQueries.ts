import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unifiedBlogService } from '@/services/unifiedBlogService';
import { toast } from 'sonner';

// Simplified blog queries using the unified service
const blogKeys = {
  all: ['blog-posts'] as const,
  published: () => [...blogKeys.all, 'published'] as const,
  post: (id: string) => [...blogKeys.all, 'post', id] as const,
  category: (category: string) => [...blogKeys.all, 'category', category] as const,
};

// Get published blog posts
export const usePublishedBlogPosts = () => {
  return useQuery({
    queryKey: blogKeys.published(),
    queryFn: () => unifiedBlogService.getPublishedPosts(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get single blog post by slug or ID
export const useBlogPost = (identifier: string | undefined, includeUnpublished = false) => {
  return useQuery({
    queryKey: blogKeys.post(identifier || ''),
    queryFn: () => identifier ? unifiedBlogService.getPost(identifier, includeUnpublished) : null,
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  });
};

// Get posts by category
export const useBlogPostsByCategory = (category: string) => {
  return useQuery({
    queryKey: blogKeys.category(category),
    queryFn: () => unifiedBlogService.getPostsByCategory(category),
    staleTime: 10 * 60 * 1000,
  });
};

// Create blog post
export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unifiedBlogService.generateFromSocialPost,
    onSuccess: () => {
      toast.success('Blog post created successfully');
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (error: any) => {
      console.error('Blog creation error:', error);
      toast.error(error.message || 'Failed to create blog post');
    },
  });
};

// Update blog post
export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      unifiedBlogService.savePost(data, id),
    onSuccess: () => {
      toast.success('Blog post updated successfully');
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (error: any) => {
      console.error('Blog update error:', error);
      toast.error(error.message || 'Failed to update blog post');
    },
  });
};

// Delete blog post
export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unifiedBlogService.deletePost,
    onSuccess: () => {
      toast.success('Blog post deleted successfully');
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
    onError: (error: any) => {
      console.error('Blog deletion error:', error);
      toast.error(error.message || 'Failed to delete blog post');
    },
  });
};