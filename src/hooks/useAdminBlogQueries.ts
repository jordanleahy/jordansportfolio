import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BlogPost } from '@/types/blog';
import { blogKeys } from './useBlogQueries';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

export const useAdminAllBlogPosts = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  return useQuery({
    queryKey: blogKeys.list({ admin: true, status: 'all' }),
    queryFn: async (): Promise<BlogPost[]> => {
      console.log('Fetching all blog posts for admin user:', user?.id);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching all blog posts:', error);
        throw new Error(`Failed to fetch blog posts: ${error.message}`);
      }

      console.log('Successfully fetched', data?.length || 0, 'blog posts');
      return data || [];
    },
    enabled: !!user && isAdmin && !roleLoading, // Only run when user is authenticated and confirmed as admin
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAdminDraftBlogPosts = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  return useQuery({
    queryKey: blogKeys.list({ admin: true, status: 'draft' }),
    queryFn: async (): Promise<BlogPost[]> => {
      console.log('Fetching draft blog posts for admin user:', user?.id);
      
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .in('status', ['draft'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching draft blog posts:', error);
        throw new Error(`Failed to fetch draft blog posts: ${error.message}`);
      }

      console.log('Successfully fetched', data?.length || 0, 'draft blog posts');
      return data || [];
    },
    enabled: !!user && isAdmin && !roleLoading, // Only run when user is authenticated and confirmed as admin
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        throw new Error(`Failed to delete blog post: ${error.message}`);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch all blog posts queries
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
