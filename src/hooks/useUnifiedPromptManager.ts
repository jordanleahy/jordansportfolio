
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import { useThemeCompletion } from '@/hooks/useThemeCompletion';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { QUERY_KEYS, QUERY_CONFIG } from '@/constants/queryKeys';
import type { SocialMediaPost } from '@/types/socialMedia';

// Define a type for the prompt status
export type PromptStatus = 'pending' | 'processing' | 'complete' | 'error';

// Hook to manage individual prompt generation and status
export const useUnifiedPromptManager = (themeId: string, themeName: string, category: string) => {
  const user = useUser();
  const userId = user?.id;
  const { toast } = useToast();
  const { setProcessing, isGenerating } = useProcessingStatesContext();
  const { checkAndSetThemeCompletion } = useThemeCompletion(themeId);
  const { getCreditStatus, enforceUsage } = useCreditCheck();
  const [isInitialized, setIsInitialized] = useState(false);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [promptStatuses, setPromptStatuses] = useState<{ [postId: string]: PromptStatus }>({});
  const [allPromptsGenerated, setAllPromptsGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing posts for the theme
  const { data: existingPosts, refetch: refetchPosts } = useQuery({
    queryKey: QUERY_KEYS.postsByTheme(themeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('theme_id', themeId)
        .order('day', { ascending: true });

      if (error) {
        console.error("Error fetching existing posts:", error);
        throw error;
      }
      return data as any[];
    },
    staleTime: QUERY_CONFIG.POSTS_STALE_TIME,
  });

  // Initialize posts and prompt statuses
  useEffect(() => {
    if (existingPosts && !isInitialized) {
      setPosts(existingPosts);
      const initialStatuses = existingPosts.reduce((acc: { [postId: string]: PromptStatus }, post) => {
        // Use generated_image_prompt as indicator since individual_prompt_status doesn't exist
        acc[post.id] = post.generated_image_prompt ? 'complete' : 'pending';
        return acc;
      }, {});
      setPromptStatuses(initialStatuses);
      setIsInitialized(true);
    }
  }, [existingPosts, isInitialized, setPromptStatuses]);

  // Check if all prompts are generated
  useEffect(() => {
    if (posts.length > 0) {
      const allGenerated = posts.every(post => post.generated_image_prompt);
      setAllPromptsGenerated(allGenerated);
    }
  }, [posts]);

  // Function to generate individual image prompts for all posts
  const generateAllImagePrompts = useCallback(async () => {
    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to generate image prompts.",
        variant: "destructive",
      });
      return;
    }

    const creditStatus = getCreditStatus();
    if (!creditStatus.hasCredits) {
      toast({
        title: "No credits remaining",
        description: "You don't have enough credits to generate all image prompts.",
        variant: "destructive",
      });
      return;
    }

    const usageCheck = await enforceUsage('image_generation', posts.length);
    if (!usageCheck.allowed) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize the prompt statuses
      const initialStatuses = posts.reduce((acc: { [postId: string]: PromptStatus }, post) => {
        acc[post.id] = 'pending';
        return acc;
      }, {});
      setPromptStatuses(initialStatuses);

      // Loop through each post and generate a prompt
      for (const post of posts) {
        if (isGenerating(post.id)) {
          console.warn(`Post ${post.id} is already processing. Skipping.`);
          continue;
        }

        setProcessing(post.id, 'generate', true);
        setPromptStatuses(prevState => ({ ...prevState, [post.id]: 'processing' }));

        const tempPostId = uuidv4();
        let postNumber = post.day;

        // Create temporary post for processing
        const { error: tempPostError } = await supabase
          .from('social_media_posts')
          .insert({
            id: tempPostId,
            theme_id: themeId,
            title: `Post ${postNumber}`,
            story_description: '', // Use story_description column as it exists in database
            day: postNumber,
            user_id: userId,
            category: category,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (tempPostError) {
          console.error("Error creating temporary post:", tempPostError);
          setPromptStatuses(prevState => ({ ...prevState, [post.id]: 'error' }));
          setProcessing(post.id, 'generate', false);
          continue;
        }

        // Call the edge function to generate the prompt
        const generatePrompt = async (postId: string) => {
          const { data, error } = await supabase.functions.invoke('generate-individual-image-prompt', {
            body: {
              theme_name: themeName,
              category: category,
              title: `Post ${postNumber}`,
              description: '', // Use description column as it exists in database
              postId: postId,
              tempPostId: tempPostId
            }
          });

          if (error) {
            console.error("Error generating individual image prompt:", error);
            setPromptStatuses(prevState => ({ ...prevState, [post.id]: 'error' }));
            setProcessing(post.id, 'generate', false);
            return;
          }

          // Update the post with the generated prompt
          const { error: updateError } = await supabase
            .from('social_media_posts')
            .update({
              generated_image_prompt: 'completed',
            })
            .eq('id', post.id);

          if (updateError) {
            console.error("Error updating post with individual prompt status:", updateError);
            setPromptStatuses(prevState => ({ ...prevState, [post.id]: 'error' }));
            setProcessing(post.id, 'generate', false);
            return;
          }

          setPromptStatuses(prevState => ({ ...prevState, [post.id]: 'complete' }));
          setProcessing(post.id, 'generate', false);
        };

        await generatePrompt(post.id);
      }

      // Refetch posts to update the UI
      await refetchPosts();

      // Check and set theme completion
      await checkAndSetThemeCompletion();

      toast({
        title: "Image prompts generated",
        description: "Successfully generated individual image prompts for all posts.",
      });
    } catch (error: any) {
      console.error("Error generating all image prompts:", error);
      setError(error.message || "Failed to generate all image prompts.");
      toast({
        title: "Error",
        description: "Failed to generate all image prompts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, themeName, category, posts, supabase, toast, setProcessing, refetchPosts, checkAndSetThemeCompletion, getCreditStatus, enforceUsage, isGenerating, themeId]);

  return {
    posts,
    promptStatuses,
    allPromptsGenerated,
    error,
    isLoading,
    generateAllImagePrompts,
  };
};
