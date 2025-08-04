import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreamingProgress {
  stage: string;
  progress: number;
  partialImage?: string;
  imageUrl?: string;
  prompt?: string;
}

interface UseThemeImageStreamingProps {
  category: string;
  enabled?: boolean;
}

export const useThemeImageStreaming = ({ category, enabled = true }: UseThemeImageStreamingProps) => {
  const [streamingProgress, setStreamingProgress] = useState<StreamingProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Listen for real-time database updates
  useEffect(() => {
    if (!enabled || !category) return;

    const channel = supabase
      .channel(`theme-image-${category}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'social_media_posts',
          filter: `category=eq.${category}`
        },
        (payload) => {
          console.log('Theme image update:', payload);
          
          const { theme_image_generation_status, theme_image_4_3_url } = payload.new as any;
          
          if (theme_image_generation_status === 'generating') {
            setIsGenerating(true);
            setError(null);
          } else if (theme_image_generation_status === 'complete' && theme_image_4_3_url) {
            setIsGenerating(false);
            setStreamingProgress({
              stage: 'complete',
              progress: 100,
              imageUrl: theme_image_4_3_url
            });
          } else if (theme_image_generation_status === 'failed') {
            setIsGenerating(false);
            setError('Image generation failed');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, enabled]);

  const startStreaming = async (postData: { title: string; description: string }) => {
    if (!category) return;

    setIsGenerating(true);
    setError(null);
    setStreamingProgress(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Get the first post from this category to get the postId
      const { data: posts, error: postsError } = await supabase
        .from('social_media_posts')
        .select('id')
        .eq('category', category)
        .eq('user_id', session.user.id)
        .limit(1);

      if (postsError || !posts || posts.length === 0) {
        throw new Error('No posts found for this category');
      }

      const postId = posts[0].id;

      // Set generating status in database
      await supabase
        .from('social_media_posts')
        .update({ theme_image_generation_status: 'generating' })
        .eq('category', category)
        .eq('user_id', session.user.id);

      // Close existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Use fetch for streaming instead of EventSource for auth support
      const response = await fetch(`https://wgwmzfbnkovumqcvsxgd.supabase.co/functions/v1/streaming-image-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          postId: postId,
          title: postData.title,
          description: postData.description,
          category,
          aspectRatio: '4:3',
          mode: 'theme',
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setStreamingProgress(data);
              } else if (data.type === 'error') {
                setError(data.message);
                setIsGenerating(false);
                return;
              }
            } catch (err) {
              console.error('Error parsing SSE data:', err);
            }
          }
        }
      }

      setIsGenerating(false);

    } catch (err) {
      console.error('Error starting streaming:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    streamingProgress,
    isGenerating,
    error,
    startStreaming
  };
};