import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BlogService } from '@/services/blogService';
import { BlogPost, BlogPostInput, VisualSection } from '@/types/blog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Query keys for consistent caching
export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...blogKeys.lists(), { filters }] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
  user: (userId: string) => [...blogKeys.all, 'user', userId] as const,
  nextPost: (slug: string) => [...blogKeys.all, 'next', slug] as const,
};

// Get all published blog posts
export const usePublishedBlogPosts = () => {
  return useQuery({
    queryKey: blogKeys.list({ status: 'published' }),
    queryFn: () => BlogService.getAllPublishedPosts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false,
  });
};

// Helper to detect if parameter is UUID (ID) or slug
const isUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// Get blog post by slug or ID
export const useBlogPost = (identifier: string | undefined, includeUnpublished = false) => {
  return useQuery({
    queryKey: blogKeys.detail(identifier || ''),
    queryFn: () => {
      if (!identifier) return null;
      
      // If it's a UUID, fetch by ID (for editor), otherwise by slug (for public)
      if (isUUID(identifier)) {
        return BlogService.getPostById(identifier);
      } else {
        return BlogService.getPostBySlug(identifier, includeUnpublished);
      }
    },
    enabled: !!identifier,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry for 404s
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Get user's blog posts
export const useUserBlogPosts = (userId: string | undefined) => {
  return useQuery({
    queryKey: blogKeys.user(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) throw new Error(`Failed to fetch user posts: ${error.message}`);
      return data || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get next blog post
export const useNextBlogPost = (currentSlug: string | undefined) => {
  return useQuery({
    queryKey: blogKeys.nextPost(currentSlug || ''),
    queryFn: () => currentSlug ? BlogService.getNextBlogPost(currentSlug) : null,
    enabled: !!currentSlug,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Create blog post mutation
export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: BlogPostInput) => BlogService.createPost(data),
    onSuccess: (newPost) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      if (newPost.user_id) {
        queryClient.invalidateQueries({ queryKey: blogKeys.user(newPost.user_id) });
      }
      
      // Add to cache
      queryClient.setQueryData(blogKeys.detail(newPost.slug), newPost);
      
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create blog post",
        variant: "destructive",
      });
      console.error('Create blog post error:', error);
    },
  });
};

// Update blog post mutation
export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BlogPostInput> }) => 
      BlogService.updatePost(id, data),
    onSuccess: (updatedPost) => {
      // Update cache directly
      queryClient.setQueryData(blogKeys.detail(updatedPost.slug), updatedPost);
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      if (updatedPost.user_id) {
        queryClient.invalidateQueries({ queryKey: blogKeys.user(updatedPost.user_id) });
      }
      
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update blog post",
        variant: "destructive",
      });
      console.error('Update blog post error:', error);
    },
  });
};

// Delete blog post mutation
export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => BlogService.deletePost(id),
    onSuccess: (_, deletedId) => {
      // Invalidate all blog-related caches to ensure UI refresh
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
      console.error('Delete blog post error:', error);
    },
  });
};

// Prefetch blog post
export const usePrefetchBlogPost = () => {
  const queryClient = useQueryClient();
  
  return (slug: string, includeUnpublished = false) => {
    queryClient.prefetchQuery({
      queryKey: blogKeys.detail(slug),
      queryFn: () => BlogService.getPostBySlug(slug, includeUnpublished),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
};
