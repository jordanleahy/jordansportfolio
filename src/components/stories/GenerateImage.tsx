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
import type { SocialMediaPost } from '@/types/socialMedia';
import type { GenerateImageProps } from '@/types/stories/ui';
import type { AspectRatio } from '@/types/bulkImageGeneration';
import { useParams } from 'react-router-dom';

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
    // Check credits before proceeding
    if (!creditStatus.hasCredits) {
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
      return; // Toast already shown by enforceUsage
    }

    try {
      setIsGenerating(true);
      
      // Register with global processing state for timer
      setProcessing(post.id, 'generate', true, aspectRatio as AspectRatio);
      
      // Notify parent immediately that generation has started
      if (onGenerationStart) {
        onGenerationStart(post.id, type);
      }
      
      toast.info('Generating image prompt...');
      
      const promptResponse = await supabase.functions.invoke('visual-prompt-generator', {
        body: {
          postId: post.id,
          themeId: (post as any).theme_id || undefined,
          aspectRatio: aspectRatio
        }
      });

      if (promptResponse.error) {
        console.error('Prompt generation failed:', promptResponse.error);
        throw new Error(`Failed to generate prompt: ${promptResponse.error.message}`);
      }

      const generatedPrompt = promptResponse.data?.generatedPrompt;
      if (!generatedPrompt) {
        console.error('No prompt in response:', promptResponse.data);
        throw new Error('No prompt generated');
      }

      // Step 2: Generate image
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
        console.error('Image generation failed:', imageResponse.error);
        throw new Error(`Failed to generate image: ${imageResponse.error.message}`);
      }

      const base64Image = imageResponse.data?.image;
      if (!base64Image) {
        console.error('No image in response:', imageResponse.data);
        throw new Error('No image generated');
      }

      // Step 3: Convert to file and upload
      toast.info('Processing and uploading image...');

      // Convert base64 to blob
      const response = await fetch(`data:image/jpeg;base64,${base64Image}`);
      const blob = await response.blob();
      
      // Create file object
      const fileName = `generated_${post.id}_${type}_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // Upload to storage
      const uploadResult = await uploadFileToStorage(file);
      
      if (!uploadResult.success || !uploadResult.url) {
        console.error('Upload failed:', uploadResult.error);
        throw new Error(uploadResult.error || 'Failed to upload generated image');
      }

      // Update the post with the new image URL
      const updateField = `image_${type}_url`;
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ [updateField]: uploadResult.url })
        .eq('id', post.id);

      if (updateError) {
        console.error('Database update failed:', updateError);
        throw new Error(`Failed to update post: ${updateError.message}`);
      }

      onImageGenerated(post.id, type, uploadResult.url);
      toast.success('Image generated and uploaded successfully!');

    } catch (error) {
      console.error('Image generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      // Clear global processing state 
      setProcessing(post.id, 'generate', false, aspectRatio as AspectRatio);
      
      setIsGenerating(false);
      if (onGenerationEnd) {
        try {
          onGenerationEnd(post.id, type);
        } catch (e) {
          console.warn('onGenerationEnd callback error:', e);
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
        
        if (shouldShowShimmer) {
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
          return null;
        }
      })()}
    </div>
  );
};