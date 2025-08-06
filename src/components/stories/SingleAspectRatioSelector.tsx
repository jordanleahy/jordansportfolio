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

export const SingleAspectRatioSelector: React.FC<SingleAspectRatioSelectorProps> = ({
  post,
  onGenerateImage,
  onPostsChange,
}) => {

  const aspectRatioOptions = ASPECT_RATIO_CONFIGS.map(config => ({
    value: config.key,
    label: config.label
  }));

  const handleGenerateImage = async (aspectRatio: AspectRatioKey) => {
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Image actions"
          className="h-8 w-8 p-0"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-background border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-sm font-medium">
          Generate
        </DropdownMenuLabel>
        {aspectRatioOptions.map((option) => {
          return (
            <DropdownMenuItem
              key={`generate-${option.value}`}
              onClick={() => handleGenerateImage(option.value)}
              className="cursor-pointer text-sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};