import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSocialMediaPost = (postId: string | undefined) => {
  return useQuery({
    queryKey: ['social-media-post', postId],
    queryFn: async () => {
      if (!postId) return null;
      
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('id, theme_id, category')
        .eq('id', postId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching social media post:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!postId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};