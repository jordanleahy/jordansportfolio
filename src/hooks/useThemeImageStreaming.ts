import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EDGE_FUNCTION_NAMES } from '@/constants/edgeFunctionConstants';
import { StreamingProgress, UseThemeImageStreamingProps, UseThemeImageStreamingReturn } from '@/types/stories';

export const useThemeImageStreaming = ({ category, enabled = true }: UseThemeImageStreamingProps) => {
  const [streamingProgress, setStreamingProgress] = useState<StreamingProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 5-minute timeout for shimmer removal
  const GENERATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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
          
          // Only set generating if we don't already have an image URL
          if (theme_image_generation_status === 'generating' && !theme_image_4_3_url) {
            setIsGenerating(true);
            setError(null);
            setHasTimedOut(false);
            
            // Start timeout timer
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
              console.log('⏰ Theme image generation timed out after 5 minutes');
              setIsGenerating(false);
              setHasTimedOut(true);
              setError('Image generation timed out. You can retry or use the theme without an image.');
            }, GENERATION_TIMEOUT_MS);
            
          } else if (theme_image_generation_status === 'complete' && theme_image_4_3_url) {
            // Clear timeout on success
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setIsGenerating(false);
            setHasTimedOut(false);
            setStreamingProgress({
              stage: 'completed',
              progress: 100,
              imageUrl: theme_image_4_3_url
            });
          } else if (theme_image_generation_status === 'failed') {
            // Clear timeout on failure
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setIsGenerating(false);
            setError('Image generation failed. You can retry or use the theme without an image.');
          } else if (theme_image_4_3_url) {
            // If we have an image URL, ensure we're not generating
            setIsGenerating(false);
            setStreamingProgress({
              stage: 'completed',
              progress: 100,
              imageUrl: theme_image_4_3_url
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, enabled]);

  const startStreaming = async (firstPostData?: { title: string; description: string }) => {
    if (!category) return;

    setIsGenerating(true);
    setError(null);
    setStreamingProgress(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Get theme info for the description
      const { data: posts, error: postsError } = await supabase
        .from('social_media_posts')
        .select(`
          themes!inner(theme_name, description)
        `)
        .eq('category', category)
        .eq('user_id', session.user.id)
        .limit(1);

      if (postsError || !posts || posts.length === 0) {
        console.warn(`No posts found for category: ${category}. Theme generation may not have completed yet.`);
        setError('No posts found for this category. Please try generating a theme first.');
        setIsGenerating(false);
        return;
      }

      const theme = posts[0].themes?.theme_name || category;
      const themeDescription = posts[0].themes?.description || firstPostData?.description || 'No description available';

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

      // Use the correct function for theme image generation
      const response = await fetch(`https://wgwmzfbnkovumqcvsxgd.supabase.co/functions/v1/${EDGE_FUNCTION_NAMES.USER_IDEA_STREAMING_IMAGE_PIPELINE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          description: themeDescription,
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
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Split by double newlines (SSE message boundaries)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep the last incomplete message
        
        for (const message of messages) {
          const lines = message.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line.length > 6) {
              const dataContent = line.slice(6).trim();
              
              if (!dataContent || dataContent === '[DONE]') {
                continue;
              }
              
              try {
                const data = JSON.parse(dataContent);
                
                if (data.type === 'progress') {
                  // Handle smooth partial image transitions
                  if (data.stage.startsWith('partial_') || data.stage === 'image_generated') {
                    setStreamingProgress(prevProgress => ({
                      ...data,
                      // Preserve previous image briefly for smooth transition
                      previousImage: prevProgress?.partialImage
                    }));
                    
                    // If we have a partial image, show it immediately
                    if (data.partialImage) {
                      console.log(`📸 Received ${data.isPartial ? 'partial' : 'final'} image for ${category}, stage: ${data.stage}`);
                    }
                  } else {
                    setStreamingProgress(data);
                  }
                } else if (data.type === 'error') {
                  setError(data.message);
                  setIsGenerating(false);
                  return;
                }
              } catch (err) {
                console.error('Error parsing SSE data:', err);
                // Log first part of problematic data for debugging
                console.log('Problematic data preview:', dataContent.substring(0, 200) + '...');
              }
            }
          }
        }
      }
      
      // Process any remaining buffered data
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line.length > 6) {
            const dataContent = line.slice(6).trim();
            if (dataContent && dataContent !== '[DONE]') {
              try {
                const data = JSON.parse(dataContent);
                if (data.type === 'progress') {
                  setStreamingProgress(data);
                }
              } catch (err) {
                console.log('Error parsing final buffered data:', err);
              }
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

  // Retry function for failed or timed-out generations
  const retryGeneration = async () => {
    if (!category) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Reset states
      setError(null);
      setHasTimedOut(false);
      setIsGenerating(true);

      // Trigger background image generation directly
      const { data: posts } = await supabase
        .from('social_media_posts')
        .select(`
          title,
          description,
          themes!inner(theme_name)
        `)
        .eq('category', category)
        .eq('user_id', session.user.id)
        .limit(1);

      if (!posts || posts.length === 0) {
        throw new Error('No posts found for retry');
      }

      const post = posts[0];

      // Call background function directly
      const { error: bgError } = await supabase.functions.invoke(EDGE_FUNCTION_NAMES.GENERATE_THEME_IMAGE_BACKGROUND, {
        body: {
          theme: post.themes?.theme_name || category,
          category: category,
          userId: session.user.id,
          firstPostTitle: post.title,
          firstPostDescription: post.description
        }
      });

      if (bgError) {
        throw bgError;
      }

      console.log('✅ Retry: Background image generation started');
    } catch (err) {
      console.error('Error retrying generation:', err);
      setError(err instanceof Error ? err.message : 'Retry failed');
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup timeout on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    streamingProgress,
    isGenerating,
    error,
    hasTimedOut,
    startStreaming,
    retryGeneration
  };
};