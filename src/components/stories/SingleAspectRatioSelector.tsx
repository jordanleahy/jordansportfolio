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
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useToast } from '@/hooks/use-toast';

export const SingleAspectRatioSelector: React.FC<SingleAspectRatioSelectorProps> = ({
  post,
  onGenerateImage,
  onPostsChange,
  isProcessing,
}) => {
  const { toast } = useToast();
  const { getCreditStatus, enforceUsage, getBlockingMessage } = useCreditCheck();
  
  const creditStatus = getCreditStatus();

  const aspectRatioOptions = ASPECT_RATIO_CONFIGS.map(config => ({
    value: config.key,
    label: config.label
  }));

  const handleGenerateImage = async (aspectRatio: AspectRatioKey) => {
    // Check credits before proceeding
    if (!creditStatus.hasCredits) {
      toast({
        title: "No credits remaining",
        description: getBlockingMessage(creditStatus),
        variant: "destructive"
      });
      return;
    }

    // Enforce usage limits
    const usageCheck = await enforceUsage('gpt_image_generation', 1);
    if (!usageCheck.allowed) {
      return; // Toast already shown by enforceUsage
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
          title={!creditStatus.hasCredits ? getBlockingMessage(creditStatus) : "Image actions"}
          className={`h-8 w-8 p-0 ${!creditStatus.hasCredits ? 'opacity-50' : ''}`}
          disabled={isGenerating || !creditStatus.hasCredits || creditStatus.isLoading}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className={`h-4 w-4 ${!creditStatus.hasCredits ? 'opacity-50' : ''}`} />
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
          const aspectRatioConfig = ASPECT_RATIO_CONFIGS.find(config => config.key === option.value);
          
          return (
            <DropdownMenuItem
              key={`generate-${option.value}`}
              onClick={() => handleGenerateImage(option.value)}
              className={`cursor-pointer text-sm ${!creditStatus.hasCredits ? 'opacity-50' : ''} ${isGeneratingAspectRatio ? 'bg-primary/5' : ''}`}
              disabled={isGenerating || !creditStatus.hasCredits || creditStatus.isLoading}
              title={!creditStatus.hasCredits ? getBlockingMessage(creditStatus) : `Generate ${option.label} image`}
            >
              <div className="flex items-center w-full">
                <div className="flex items-center flex-1">
                  {isGeneratingAspectRatio ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {option.label}
                </div>
                
                {/* Mini shimmer preview when generating */}
                {isGeneratingAspectRatio && (
                  <div className="ml-2 flex items-center gap-2">
                    <div 
                      className="w-8 h-6 bg-gradient-to-r from-primary/20 to-primary/10 rounded-sm relative overflow-hidden"
                      style={{ aspectRatio: aspectRatioConfig?.ratio.replace(':', '/') || '16/9' }}
                    >
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                    <span className="text-xs text-primary">Generating...</span>
                  </div>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};