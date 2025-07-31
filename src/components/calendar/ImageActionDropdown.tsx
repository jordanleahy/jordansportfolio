import React from 'react';
import { ImageIcon, Loader2, Upload, Sparkles } from 'lucide-react';
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
interface ImageActionDropdownProps {
  post: SocialMediaPost;
  isUploading: (postId: string, aspectRatio?: AspectRatioKey) => boolean;
  getUploadType: (postId: string) => AspectRatioKey | null;
  onFileSelect: (postId: string, aspectRatio: AspectRatioKey) => void;
  onGenerateImage: (postId: string, aspectRatio: AspectRatioKey, title: string, description: string, category?: string) => Promise<{ success: boolean; imageUrl?: string; error?: string }>;
  onPostsChange?: (posts: SocialMediaPost[]) => void;
}

export const ImageActionDropdown: React.FC<ImageActionDropdownProps> = ({
  post,
  isUploading,
  getUploadType,
  onFileSelect,
  onGenerateImage,
  onPostsChange,
}) => {
  
  const postIsUploading = isUploading(post.id);
  const uploadType = getUploadType(post.id);

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
          disabled={postIsUploading}
          title="Image actions"
          className="h-8 w-8 p-0"
        >
          {postIsUploading ? (
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
          Upload
        </DropdownMenuLabel>
        {aspectRatioOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onFileSelect(post.id, option.value)}
            className="cursor-pointer text-sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-sm font-medium">
          Generate
        </DropdownMenuLabel>
        {aspectRatioOptions.map((option) => {
          const isGeneratingThis = isUploading(post.id, option.value);
          return (
            <DropdownMenuItem
              key={`generate-${option.value}`}
              onClick={() => handleGenerateImage(option.value)}
              disabled={postIsUploading || isGeneratingThis}
              className="cursor-pointer text-sm"
            >
              {isGeneratingThis ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};