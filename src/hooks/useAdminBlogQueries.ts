import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BlogPost } from '@/types/blog';

export const useAdminAllBlogPosts = () => {
  return useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch blog posts: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAdminDraftBlogPosts = () => {
  return useQuery({
    queryKey: ['admin-draft-blog-posts'],
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .in('status', ['draft'])
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch draft blog posts: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};