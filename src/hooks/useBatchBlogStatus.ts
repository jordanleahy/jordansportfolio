import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BlogStatus {
  exists: boolean;
  status?: 'draft' | 'published';
  id?: string;
  slug?: string;
  isLoading: boolean;
  error?: string;
}

export const useBatchBlogStatus = (postIds: string[]) => {
  const [blogStatuses, setBlogStatuses] = useState<Record<string, BlogStatus>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBlogStatuses = async () => {
      if (!postIds.length) {
        setBlogStatuses({});
        return;
      }

      setIsLoading(true);
      
      try {
        // Batch query for all blog posts by social media post IDs
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, slug, status, hero_headline, social_media_post_id, created_at')
          .in('social_media_post_id', postIds)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching blog statuses:', error);
          // Set all to not exist with error
          const errorStatuses = postIds.reduce((acc, postId) => ({
            ...acc,
            [postId]: {
              exists: false,
              isLoading: false,
              error: error.message,
            }
          }), {});
          setBlogStatuses(errorStatuses);
          setIsLoading(false);
          return;
        }

        // Group by social_media_post_id and take the most recent
        const blogsByPostId = data?.reduce((acc, blog) => {
          const postId = blog.social_media_post_id;
          if (!acc[postId] || new Date(blog.created_at) > new Date(acc[postId].created_at)) {
            acc[postId] = blog;
          }
          return acc;
        }, {} as Record<string, any>) || {};

        // Create status map for all requested post IDs
        const statuses = postIds.reduce((acc, postId) => {
          const blog = blogsByPostId[postId];
          
          acc[postId] = blog ? {
            exists: true,
            status: blog.status as 'draft' | 'published',
            id: blog.id,
            slug: blog.slug,
            isLoading: false,
          } : {
            exists: false,
            isLoading: false,
          };
          
          return acc;
        }, {} as Record<string, BlogStatus>);

        setBlogStatuses(statuses);
      } catch (error) {
        console.error('Error in batch blog status fetch:', error);
        const errorStatuses = postIds.reduce((acc, postId) => ({
          ...acc,
          [postId]: {
            exists: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }), {});
        setBlogStatuses(errorStatuses);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogStatuses();
  }, [postIds.join(',')]);

  return { blogStatuses, isLoading };
};