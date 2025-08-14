import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ChevronDown, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { uploadFileToStorage } from '@/utils/fileUpload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { PostImageUploadCardProps } from '@/types/stories/ui';
import { useParams } from 'react-router-dom';

export const PostImageUploadCard = ({ 
  post,
  type,
  label,
  imageUrl,
  isUploading,
  onImageDelete,
  onImageGenerated,
  onGenerationStart,
  onGenerationEnd,
  themeName,
  hasPrompt = true
}: PostImageUploadCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const params = useParams();
  const routeTheme = params.theme ? decodeURIComponent(params.theme) : undefined;
  const theme = themeName ?? routeTheme;
  
  const { toast: toastHook } = useToast();
  const { getCreditStatus, enforceUsage, getBlockingMessage } = useCreditCheck();
  
  // Debug effect to track state changes
  useEffect(() => {
    console.log('🎨 IMAGE_GEN: State changed for', type, ':', {
      isGenerating,
      isUploading,
      hasImageUrl: !!imageUrl,
    });
  }, [isGenerating, isUploading, imageUrl, type]);

  const creditStatus = getCreditStatus();

  const aspectRatioMap = {
    '16_9': '16:9',
    '9_16': '9:16', 
    '3_4': '3:4',
    '4_3': '4:3',
    '1_1': '1:1'
  };

  const aspectRatio = aspectRatioMap[type];

  const handleGenerateImage = async () => {
    console.log('🎨 IMAGE_GEN: Starting handleGenerateImage', {
      postId: post.id,
      type,
      hasCredits: creditStatus.hasCredits,
      isGenerating,
      isUploading
    });

    // Check credits before proceeding
    if (!creditStatus.hasCredits) {
      console.log('🚫 IMAGE_GEN: No credits available');
      toastHook({
        title: "No credits remaining",
        description: getBlockingMessage(creditStatus),
        variant: "destructive"
      });
      return;
    }
    
    if (!post.title || !post.description) {
      console.log('🚫 IMAGE_GEN: Missing title or description');
      toastHook({
        title: "Generation failed",
        description: "Post must have title and description for AI generation.",
        variant: "destructive",
      });
      return;
    }

    // Enforce usage limits
    const usageCheck = await enforceUsage('gpt_image_generation', 1);
    if (!usageCheck.allowed) {
      console.log('🚫 IMAGE_GEN: Usage check failed');
      return; // Toast already shown by enforceUsage
    }

    try {
      console.log('🎨 IMAGE_GEN: Starting generation for post', post.id, 'ratio', type, 'setting status to \'uploading\'');
      setIsGenerating(true);
      
      // Notify parent immediately that generation has started
      if (onGenerationStart) {
        console.log('🎨 IMAGE_GEN: Calling onGenerationStart callback');
        onGenerationStart(post.id, type);
      }
      
      console.log('🎨 IMAGE_GEN: Step 1 - Generating prompt...');
      toast.info('Generating image prompt...');
      
      const promptResponse = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: {
          postId: post.id,
          themeId: (post as any).theme_id || undefined,
          aspectRatio: aspectRatio
        }
      });

      if (promptResponse.error) {
        console.error('🚫 IMAGE_GEN: Prompt generation failed:', promptResponse.error);
        throw new Error(`Failed to generate prompt: ${promptResponse.error.message}`);
      }

      const generatedPrompt = promptResponse.data?.generatedPrompt;
      console.log('✅ IMAGE_GEN: Prompt generated successfully:', generatedPrompt?.substring(0, 100) + '...');
      if (!generatedPrompt) {
        console.error('🚫 IMAGE_GEN: No prompt in response:', promptResponse.data);
        throw new Error('No prompt generated');
      }

      // Step 2: Generate image
      
      console.log('🎨 IMAGE_GEN: Step 2 - Generating image with AI...');
      toast.info('Generating image with AI...');

      const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
        body: {
          prompt: generatedPrompt,
          aspectRatio: aspectRatio,
          useManagedSeed: true,
          managedSeedCategory: post.category || 'cdi'
        }
      });

      if (imageResponse.error) {
        console.error('🚫 IMAGE_GEN: Image generation failed:', imageResponse.error);
        throw new Error(`Failed to generate image: ${imageResponse.error.message}`);
      }

      const base64Image = imageResponse.data?.image;
      console.log('✅ IMAGE_GEN: Image generated successfully, base64 length:', base64Image?.length);
      if (!base64Image) {
        console.error('🚫 IMAGE_GEN: No image in response:', imageResponse.data);
        throw new Error('No image generated');
      }

      // Step 3: Convert to file and upload
      
      console.log('🎨 IMAGE_GEN: Step 3 - Processing and uploading image...');
      toast.info('Processing and uploading image...');

      // Convert base64 to blob
      const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
      const blob = await response.blob();
      
      // Create file object
      const fileName = `generated_${post.id}_${type}_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Upload to storage
      console.log('🎨 IMAGE_GEN: Uploading file to storage:', fileName);
      const uploadResult = await uploadFileToStorage(file);
      
      if (!uploadResult.success || !uploadResult.url) {
        console.error('🚫 IMAGE_GEN: Upload failed:', uploadResult.error);
        throw new Error(uploadResult.error || 'Failed to upload generated image');
      }
      console.log('✅ IMAGE_GEN: Upload successful:', uploadResult.url);

      // Update the post with the new image URL
      console.log('🎨 IMAGE_GEN: Updating post in database...');
      const updateField = `image_${type}_url`;
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ [updateField]: uploadResult.url })
        .eq('id', post.id);

      if (updateError) {
        console.error('🚫 IMAGE_GEN: Database update failed:', updateError);
        throw new Error(`Failed to update post: ${updateError.message}`);
      }
      console.log('✅ IMAGE_GEN: Database updated successfully');

      console.log('🎨 IMAGE_GEN: Calling onImageGenerated callback');
      onImageGenerated(post.id, type, uploadResult.url);
      console.log('✅ IMAGE_GEN: Generation process completed successfully');
      toast.success('Image generated and uploaded successfully!');

    } catch (error) {
      console.error('🎨 IMAGE_GENERATION: Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      console.log('🎨 IMAGE_GEN: Cleanup - setting isGenerating to false');
      setIsGenerating(false);
      if (onGenerationEnd) {
        try {
          onGenerationEnd(post.id, type);
        } catch (e) {
          console.warn('🎨 IMAGE_GEN: onGenerationEnd callback error', e);
        }
      }
    }
  };

  const handleDeleteImage = () => {
    if (onImageDelete) {
      onImageDelete(post.id, type);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <span className="text-sm font-medium text-center sm:text-left">{label}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isUploading || isGenerating}
            >
              {(isUploading || isGenerating) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
            <DropdownMenuLabel>Generate with AI</DropdownMenuLabel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DropdownMenuItem
                      onClick={handleGenerateImage}
                      disabled={isGenerating || isUploading || !creditStatus.hasCredits || creditStatus.isLoading || !hasPrompt}
                      className={`cursor-pointer ${!creditStatus.hasCredits || !hasPrompt ? 'opacity-50' : ''}`}
                      title={
                        !hasPrompt ? "Generate individual prompt first" :
                        !creditStatus.hasCredits ? getBlockingMessage(creditStatus) : 
                        "Generate with AI"
                      }
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate ({aspectRatio})
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                {!hasPrompt && (
                  <TooltipContent>
                    <p>Generate an individual prompt first using the "Prompt" button</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {(() => {
        const shouldShowShimmer = (isUploading || isGenerating);
        console.log('🎨 IMAGE_GEN: Render decision for', type, ':', {
          isUploading,
          isGenerating,
          shouldShowShimmer,
          hasImageUrl: !!imageUrl,
          imageUrl: imageUrl?.substring(0, 50) + '...'
        });
        
        if (shouldShowShimmer) {
          console.log('🎨 IMAGE_GEN: Rendering shimmer for', type);
          return (
            <SimpleShimmer 
              aspectRatio={aspectRatio.replace(':', '/')} 
              variant="full"
              className="w-full h-16"
            />
          );
        } else if (imageUrl) {
          console.log('🎨 IMAGE_GEN: Rendering existing image for', type, ':', imageUrl);
          return (
            <div className="relative">
              <img
                src={imageUrl}
                alt={`${label} for ${post.title}`}
                className="w-full aspect-square object-cover rounded border"
                loading="lazy"
              />
              {onImageDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={handleDeleteImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        } else {
          console.log('🎨 IMAGE_GEN: No image to display for', type);
          return null;
        }
      })()}
    </div>
  );
};