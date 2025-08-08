import React from 'react';
import { ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
 } from '@/components/ui/dropdown-menu';
import type { SocialMediaPost } from '@/types/socialMedia';
import { ASPECT_RATIO_CONFIGS } from '@/types/bulkImageGeneration';
import type { AspectRatioKey } from '@/types/bulkImageGeneration';
import type { SingleAspectRatioSelectorProps } from '@/types/stories/ui';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useToast } from '@/hooks/use-toast';

export const SingleAspectRatioSelector: React.FC<SingleAspectRatioSelectorProps> = ({
  post,
  onGenerateImage,
  onPostsChange,
  isProcessing,
}) => {
  const { toast } = useToast();
  const { data: subData } = useSubscriptionStatus();
  
  // Check if user has remaining credits
  const hasCredits = subData ? (subData.subscription?.tier?.max_gpt_images || 0) - (subData.usage?.gpt_images_used || 0) > 0 : true;

  const aspectRatioOptions = ASPECT_RATIO_CONFIGS.map(config => ({
    value: config.key,
    label: config.label
  }));

  const handleGenerateImage = async (aspectRatio: AspectRatioKey) => {
    if (!hasCredits) {
      toast({
        title: "No credits remaining",
        description: "You've used all your daily image generation credits. Credits reset at midnight.",
        variant: "destructive"
      });
      return;
    }
    
    const response = await onGenerateImage(
      post.id,
      aspectRatio,
      post.title,
      post.description,
      post.category
    );
    
    // Refresh posts data if callback provided
    if (response.success && onPostsChange) {
      onPostsChange([]);
    }
  };

  // Check if any aspect ratio is being generated for this post
  const isGenerating = isProcessing?.(post.id, 'generate');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Image actions"
          className="h-8 w-8 p-0"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-background border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-sm font-medium">
          {isGenerating ? 'Generating...' : 'Generate'}
        </DropdownMenuLabel>
        {aspectRatioOptions.map((option) => {
          const isGeneratingAspectRatio = isProcessing?.(post.id, 'generate', option.value);
          return (
            <DropdownMenuItem
              key={`generate-${option.value}`}
              onClick={() => handleGenerateImage(option.value)}
              className={`cursor-pointer text-sm ${!hasCredits ? 'opacity-50' : ''}`}
              disabled={isGenerating || !hasCredits}
              title={!hasCredits ? "No credits remaining" : `Generate ${option.label} image`}
            >
              {isGeneratingAspectRatio ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {option.label}
              {isGeneratingAspectRatio && <span className="ml-auto text-xs text-muted-foreground">Generating...</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};