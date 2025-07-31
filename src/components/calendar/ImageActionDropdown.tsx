import React, { useState } from 'react';
import { ImageIcon, Loader2, Upload, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SocialMediaPost } from '@/types/socialMedia';
import { useOptimizedBatchGeneration } from '@/hooks/useOptimizedBatchGeneration';
import { ASPECT_RATIO_CONFIGS, convertAspectRatio } from '@/types/batchImageGeneration';
import type { AspectRatioKey } from '@/types/batchImageGeneration';

interface ImageActionDropdownProps {
  post: SocialMediaPost;
  isUploading: (postId: string, aspectRatio?: AspectRatioKey) => boolean;
  getUploadType: (postId: string) => AspectRatioKey | null;
  onFileSelect: (postId: string, aspectRatio: AspectRatioKey) => void;
  onPostsChange?: (posts: SocialMediaPost[]) => void;
}

export const ImageActionDropdown: React.FC<ImageActionDropdownProps> = ({
  post,
  isUploading,
  getUploadType,
  onFileSelect,
  onPostsChange,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateAllImages, isGenerating: isBatchGenerating, progress } = useOptimizedBatchGeneration();
  
  const postIsUploading = isUploading(post.id);
  const uploadType = getUploadType(post.id);

  const aspectRatioOptions = ASPECT_RATIO_CONFIGS.map(config => ({
    value: config.key,
    label: config.label
  }));

  const handleGenerateAllImages = async () => {
    if (!post) return;
    
    console.log('🚀 Starting optimized batch image generation for post:', post.id);
    
    try {
      const response = await generateAllImages({
        postId: post.id,
        title: post.title,
        description: post.description,
        category: post.category
      });

      // Refresh the post data to show the new images
      if (response.success && onPostsChange) {
        const { data: refreshedPosts } = await supabase
          .from('social_media_posts')
          .select('*')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .order('day', { ascending: true });
        
        if (refreshedPosts) {
          onPostsChange(refreshedPosts as SocialMediaPost[]);
        }
      }
      
    } catch (error) {
      console.error('❌ Optimized batch generation error:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={postIsUploading || isBatchGenerating}
          title="Image actions"
          className="h-8 w-8 p-0"
        >
          {postIsUploading || isBatchGenerating ? (
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
          Upload Images
        </DropdownMenuLabel>
        {aspectRatioOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onFileSelect(post.id, option.value)}
            className="cursor-pointer text-sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload {option.label}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-sm font-medium">
          Generate Images
        </DropdownMenuLabel>
        {aspectRatioOptions.map((option) => (
          <DropdownMenuItem
            key={`generate-${option.value}`}
            onClick={() => {/* TODO: Implement individual generation */}}
            disabled={isBatchGenerating || postIsUploading}
            className="cursor-pointer text-sm"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};