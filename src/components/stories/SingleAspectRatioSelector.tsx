import React from 'react';
import { Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import type { SocialMediaPost } from '@/types/socialMedia';
import { ASPECT_RATIO_CONFIGS } from '@/types/bulkImageGeneration';
import type { AspectRatioKey } from '@/types/bulkImageGeneration';
import type { SingleAspectRatioSelectorProps } from '@/types/stories/ui';
import { useToast } from '@/hooks/use-toast';
import { useIndividualPromptCache } from '@/hooks/useIndividualPromptCache';
import { useProcessingStatesContext } from '@/contexts/ProcessingStatesContext';

export const SingleAspectRatioSelector: React.FC<SingleAspectRatioSelectorProps> = ({
  post,
  onGenerateImage,
  onPostsChange,
}) => {
  const { toast } = useToast();
  const { updatePrompt, isUpdating, refetch } = useIndividualPromptCache(post.id);
  const { isProcessing } = useProcessingStatesContext();

  const aspectRatioOptions = ASPECT_RATIO_CONFIGS.map(config => ({
    value: config.key,
    label: config.label,
    width: config.width,
    height: config.height,
    ratio: config.ratio
  }));

  const handleGenerateWithAspectRatio = async (aspectRatioKey: AspectRatioKey) => {
    const aspectRatioConfig = ASPECT_RATIO_CONFIGS.find(config => config.key === aspectRatioKey);
    if (!aspectRatioConfig) return;

    const currentPrompt = post.generated_image_prompt || '';
    
    // Remove any existing aspect ratio dimensions
    const cleanedPrompt = currentPrompt.replace(/Image dimensions:\s*\d+x\d+\s*\([^)]+\)\.?\s*/g, '').trim();
    
    // Append new aspect ratio dimensions
    const aspectRatioText = `Image dimensions: ${aspectRatioConfig.width}x${aspectRatioConfig.height} (${aspectRatioConfig.ratio})`;
    const updatedPrompt = cleanedPrompt ? `${cleanedPrompt}. ${aspectRatioText}` : aspectRatioText;
    
    try {
      // Wait for prompt update to complete and cache to refresh
      await updatePrompt({ newPrompt: updatedPrompt });
      
      // Verify the prompt was updated in cache before proceeding
      const updatedData = await refetch();
      if (!updatedData.data?.prompt) {
        throw new Error('Failed to verify prompt update. Please try again.');
      }
      
      // Generate image with the selected aspect ratio
      onGenerateImage(post.id, aspectRatioKey, post.title, post.description, post.category);
      
      // Refresh posts data if callback provided
      if (onPostsChange) {
        onPostsChange([]);
      }
    } catch (error) {
      toast({
        title: "Error updating prompt",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Set aspect ratio"
          className="h-8 w-8 p-0"
          disabled={isUpdating || isProcessing(post.id, 'generate')}
        >
          <Image className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-background border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-sm font-medium">
          Create Image
        </DropdownMenuLabel>
        {aspectRatioOptions.map((option) => (
          <DropdownMenuItem
            key={`aspect-ratio-${option.value}`}
            onClick={() => handleGenerateWithAspectRatio(option.value)}
            className="cursor-pointer text-sm"
            disabled={isUpdating || isProcessing(post.id, 'generate')}
          >
            <div className="flex items-center w-full">
              <div className="flex items-center flex-1">
                {option.label}
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {option.width}×{option.height}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};