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

export const useBlogStatus = (postId: string) => {
  const [blogStatus, setBlogStatus] = useState<BlogStatus>({
    exists: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkBlogStatus = async () => {
      if (!postId) {
        setBlogStatus({ exists: false, isLoading: false });
        return;
      }

      try {
        setBlogStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
        
        // Query for blog posts by social media post ID
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id, slug, status, hero_headline')
          .eq('social_media_post_id', postId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          setBlogStatus({
            exists: false,
            isLoading: false,
            error: error.message,
          });
          return;
        }

        if (data) {
          setBlogStatus({
            exists: true,
            status: data.status as 'draft' | 'published',
            id: data.id,
            slug: data.slug,
            isLoading: false,
          });
        } else {
          setBlogStatus({
            exists: false,
            isLoading: false,
          });
        }
      } catch (error) {
        setBlogStatus({
          exists: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    checkBlogStatus();
  }, [postId]);

  return blogStatus;
};