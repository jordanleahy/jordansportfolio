import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, ChevronDown, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InstantLoadingIndicator } from '@/components/ui/instant-loading-indicator';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { useImageGenerationTimerContext } from '@/contexts/ImageGenerationTimerContext';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';
import { useUnifiedRegenerateStates } from '@/hooks/useUnifiedRegenerateStates';
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
import { createComponentLogger } from '@/services/logger';
import type { SocialMediaPost } from '@/types/socialMedia';
import type { GenerateImageProps } from '@/types/stories/ui';
import type { AspectRatio } from '@/types/bulkImageGeneration';
import { useParams } from 'react-router-dom';

const logger = createComponentLogger('GenerateImage');

export const GenerateImage = ({ 
  post,
  type,
  label,
  imageUrl,
  isUploading,
  onImageDelete,
  onImageGenerated,
  onGenerationStart,
  onGenerationEnd,
  // ❌ BAD: Using themeName prop - should use post.theme_id instead
  // themeName,  // REMOVED - use post.theme_id from the post object
  hasPrompt = true
}: GenerateImageProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const timer = useImageGenerationTimerContext();
  const { setProcessing } = useProcessingStatesContext();
  const { getRegenerateButtonText, isButtonDisabled, getCooldownMessage } = useUnifiedRegenerateStates();
  
  // ❌ BAD: Using theme name from route params - Phase 1 migration incomplete
  // const params = useParams();
  // const routeTheme = params.theme ? decodeURIComponent(params.theme) : undefined;
  // const theme = themeName ?? routeTheme;  // REMOVED - use post.theme_id instead
  
  const { toast: toastHook } = useToast();
  const { getCreditStatus, enforceUsage, getBlockingMessage } = useCreditCheck();

  // Timer is now managed automatically by ImageGenerationTimerContext
  
  // Debug effect to track state changes
  useEffect(() => {
    logger.debug(`State changed for ${type}`, {
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
    logger.debug('Starting handleGenerateImage', {
      postId: post.id,
      type,
      hasCredits: creditStatus.hasCredits,
      isGenerating,
      isUploading
    });

    // Check credits before proceeding
    if (!creditStatus.hasCredits) {
      logger.warn('No credits available');
      toastHook({
        title: "No credits remaining",
        description: getBlockingMessage(creditStatus),
        variant: "destructive"
      });
      return;
    }

    // Check cooldown using unified state
    if (isButtonDisabled(post.id, aspectRatio as AspectRatio)) {
      const cooldownMsg = getCooldownMessage();
      logger.warn('Generation blocked by cooldown', { cooldownMessage: cooldownMsg });
      if (cooldownMsg) {
        toastHook({
          title: "Generation Cooldown Active",
          description: cooldownMsg,
          variant: "default"
        });
      }
      return;
    }
    
    if (!post.title || !post.description) {
      logger.warn('Missing title or description');
      toastHook({
        title: "Generation failed",
        description: "Post must have title and description for AI generation.",
        variant: "destructive",
      });
      return;
    }

    // Enforce usage limits
    const usageCheck = await enforceUsage('image_generation', 1);
    if (!usageCheck.allowed) {
      logger.warn('Usage check failed');
      return; // Toast already shown by enforceUsage
    }

    try {
      logger.info('Starting generation', { postId: post.id, ratio: type });
      setIsGenerating(true);
      
      // Register with global processing state for timer
      setProcessing(post.id, 'generate', true, aspectRatio as AspectRatio);
      
      // Notify parent immediately that generation has started
      if (onGenerationStart) {
        logger.debug('Calling onGenerationStart callback');
        onGenerationStart(post.id, type);
      }
      
      logger.info('Step 1 - Generating prompt...');
      toast.info('Generating image prompt...');
      
      const promptResponse = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          postId: post.id,
          themeId: (post as any).theme_id || undefined,
          aspectRatio: aspectRatio
        }
      });

      if (promptResponse.error) {
        logger.error('Prompt generation failed', promptResponse.error);
        throw new Error(`Failed to generate prompt: ${promptResponse.error.message}`);
      }

      const generatedPrompt = promptResponse.data?.generatedPrompt;
      logger.success('Prompt generated successfully', { 
        promptPreview: generatedPrompt?.substring(0, 100) + '...' 
      });
      if (!generatedPrompt) {
        logger.error('No prompt in response', promptResponse.data);
        throw new Error('No prompt generated');
      }

      // Step 2: Generate image
      
      logger.info('Step 2 - Generating image with AI...');
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
        logger.error('Image generation failed', imageResponse.error);
        throw new Error(`Failed to generate image: ${imageResponse.error.message}`);
      }

      const base64Image = imageResponse.data?.image;
      logger.success('Image generated successfully', { base64Length: base64Image?.length });
      if (!base64Image) {
        logger.error('No image in response', imageResponse.data);
        throw new Error('No image generated');
      }

      // Step 3: Convert to file and upload
      
      logger.info('Step 3 - Processing and uploading image...');
      toast.info('Processing and uploading image...');

      // Convert base64 to blob
      const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
      const blob = await response.blob();
      
      // Create file object
      const fileName = `generated_${post.id}_${type}_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Upload to storage
      logger.debug('Uploading file to storage', { fileName });
      const uploadResult = await uploadFileToStorage(file);
      
      if (!uploadResult.success || !uploadResult.url) {
        logger.error('Upload failed', uploadResult.error);
        throw new Error(uploadResult.error || 'Failed to upload generated image');
      }
      logger.success('Upload successful', { url: uploadResult.url });

      // Update the post with the new image URL
      logger.info('Updating post in database...');
      const updateField = `image_${type}_url`;
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ [updateField]: uploadResult.url })
        .eq('id', post.id);

      if (updateError) {
        logger.error('Database update failed', updateError);
        throw new Error(`Failed to update post: ${updateError.message}`);
      }
      logger.success('Database updated successfully');

      logger.debug('Calling onImageGenerated callback');
      onImageGenerated(post.id, type, uploadResult.url);
      logger.success('Generation process completed successfully');
      toast.success('Image generated and uploaded successfully!');

    } catch (error) {
      logger.error('Image generation error', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      logger.debug('Cleanup - setting isGenerating to false');
      
      // Clear global processing state 
      setProcessing(post.id, 'generate', false, aspectRatio as AspectRatio);
      
      setIsGenerating(false);
      if (onGenerationEnd) {
        try {
          onGenerationEnd(post.id, type);
        } catch (e) {
          logger.warn('onGenerationEnd callback error', e);
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
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{label}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full justify-center"
              disabled={isGenerating || isUploading}
            >
              {(isUploading || isGenerating) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {(isUploading || isGenerating) ? 'Generating...' : 
               isButtonDisabled(post.id, aspectRatio as AspectRatio) ? 
               getRegenerateButtonText(post.id, aspectRatio as AspectRatio, !!imageUrl) :
               'Generate AI'}
              {!(isUploading || isGenerating) && !isButtonDisabled(post.id, aspectRatio as AspectRatio) && <ChevronDown className="h-4 w-4 ml-2" />}
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
                      disabled={isGenerating || isUploading || !creditStatus.hasCredits || creditStatus.isLoading || !hasPrompt || isButtonDisabled(post.id, aspectRatio as AspectRatio)}
                      className={`cursor-pointer ${!creditStatus.hasCredits || !hasPrompt || isButtonDisabled(post.id, aspectRatio as AspectRatio) ? 'opacity-50' : ''}`}
                      title={
                        !hasPrompt ? "Generate individual prompt first" :
                        !creditStatus.hasCredits ? getBlockingMessage(creditStatus) :
                        isButtonDisabled(post.id, aspectRatio as AspectRatio) ? getCooldownMessage() :
                        "Generate with AI"
                      }
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {getRegenerateButtonText(post.id, aspectRatio as AspectRatio, !!imageUrl)}
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
        if (import.meta.env.DEV) {
          logger.debug(`Render decision for ${type}`, {
            isUploading,
            isGenerating,
            shouldShowShimmer,
            hasImageUrl: !!imageUrl,
            imageUrl: imageUrl?.substring(0, 50) + '...'
          });
        }
        
        if (shouldShowShimmer) {
          if (import.meta.env.DEV) {
            logger.debug(`Rendering shimmer for ${type}`);
          }
          return (
            <div className="relative">
              <SimpleShimmer 
                aspectRatio="1/1" 
                variant="full"
                className="w-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <InstantLoadingIndicator 
                  isVisible={true}
                  message="Generating..."
                  className="text-white drop-shadow-sm"
                  timerSeconds={timer.secondsRemaining}
                  showTimer={timer.isRunning}
                  isTimerExpired={timer.isExpired}
                />
              </div>
            </div>
          );
        } else if (imageUrl) {
          if (import.meta.env.DEV) {
            logger.debug(`Rendering existing image for ${type}`, { imageUrl });
          }
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
          if (import.meta.env.DEV) {
            logger.debug(`No image to display for ${type}`);
          }
          return null;
        }
      })()}
    </div>
  );
};