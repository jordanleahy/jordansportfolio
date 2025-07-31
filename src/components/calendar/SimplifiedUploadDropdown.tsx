import React, { useState } from 'react';
import { ImageIcon, Loader2, Sparkles, ChevronDown } from 'lucide-react';
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

interface SimplifiedUploadDropdownProps {
  post: SocialMediaPost;
  isUploading: (postId: string, aspectRatio?: AspectRatioKey) => boolean;
  getUploadType: (postId: string) => AspectRatioKey | null;
  onFileSelect: (postId: string, aspectRatio: AspectRatioKey) => void;
  onPostsChange?: (posts: SocialMediaPost[]) => void;
  className?: string;
}

export const SimplifiedUploadDropdown: React.FC<SimplifiedUploadDropdownProps> = ({
  post,
  isUploading,
  getUploadType,
  onFileSelect,
  onPostsChange,
  className,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const { generateAllImages, isGenerating: isBatchGenerating, progress } = useOptimizedBatchGeneration();
  
  const postIsUploading = isUploading(post.id);
  const uploadType = getUploadType(post.id);

  // Use optimized aspect ratio configs
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

  const handleGenerateImage = async (aspectRatio: AspectRatioKey) => {
    try {
      setIsGenerating(true);
      setGenerationStep('Generating prompt...');
      
      console.log('🎨 IMAGE_GENERATION: Starting generation for post:', post.id, 'aspect:', aspectRatio);
      
      // Step 1: Generate prompt
      toast.info('Generating image prompt...');
      
      const promptResponse = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: {
          title: post.title,
          description: post.description,
          category: post.category || 'cdi',
          aspectRatio: aspectRatio.replace('_', ':') // Convert 16_9 to 16:9
        }
      });

      if (promptResponse.error) {
        throw new Error(`Failed to generate prompt: ${promptResponse.error.message}`);
      }

      const generatedPrompt = promptResponse.data?.generatedPrompt;
      if (!generatedPrompt) {
        console.error('🎨 IMAGE_GENERATION: No prompt in response:', promptResponse.data);
        throw new Error('No prompt generated');
      }

      console.log('🎨 IMAGE_GENERATION: Generated prompt:', generatedPrompt);

      // Store the generated prompt
      await supabase
        .from('social_media_posts')
        .update({ generated_image_prompt: generatedPrompt })
        .eq('id', post.id);

      // Step 2: Generate image
      setGenerationStep('Creating image...');
      toast.info('Generating image with AI...');

      const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
        body: {
          prompt: generatedPrompt,
          aspectRatio: aspectRatio.replace('_', ':')
        }
      });

      if (imageResponse.error) {
        throw new Error(`Failed to generate image: ${imageResponse.error.message}`);
      }

      const base64Image = imageResponse.data?.image;
      if (!base64Image) {
        throw new Error('No image generated');
      }

      // Step 3: Convert to file and upload
      setGenerationStep('Processing...');
      toast.info('Processing and uploading image...');

      // Convert base64 to blob
      const response = await fetch(`data:image/png;base64,${base64Image}`);
      const blob = await response.blob();
      
      // Create file object
      const fileName = `generated_${post.id}_${aspectRatio}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('general')
        .upload(`social-media/${fileName}`, file);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('general')
        .getPublicUrl(uploadData.path);

      // Update post with image URL
      const imageField = `image_${aspectRatio}_url`;
      const statusField = `image_${aspectRatio}_status`;
      
      await supabase
        .from('social_media_posts')
        .update({ 
          [imageField]: urlData.publicUrl,
          [statusField]: 'processing' // Will be updated by background processing
        })
        .eq('id', post.id);

      // Trigger background processing for watermark
      await supabase.functions.invoke('process-uploaded-images', {
        body: {
          filePath: uploadData.path,
          postId: post.id,
          aspectRatio: aspectRatio
        }
      });

      toast.success('Image generated and uploaded successfully!');
      
      // Refresh the post data
      if (onPostsChange) {
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
      console.error('🎨 IMAGE_GENERATION: Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isBatchGenerating || isUploading(post.id)}
          className={`h-8 ${className || ''}`}
        >
          {isBatchGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ImageIcon className="h-4 w-4 mr-2" />
          )}
          Images
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border shadow-md z-50">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleGenerateAllImages();
          }}
          disabled={isBatchGenerating || isUploading(post.id)}
          className="cursor-pointer focus:bg-accent"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate All Images
          {isBatchGenerating && (
            <Loader2 className="ml-auto h-4 w-4 animate-spin" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Upload Images</DropdownMenuLabel>
        {aspectRatioOptions.map((option) => (
          <DropdownMenuItem
            key={`upload-${option.value}`}
            onClick={() => {
              console.log('🖼️ IMAGE_UPLOAD: Dropdown option clicked', { 
                postId: post.id, 
                aspectRatio: option.value, 
                postTitle: post.title 
              });
              onFileSelect(post.id, option.value);
            }}
            disabled={uploadType === option.value || isGenerating}
            className="cursor-pointer focus:bg-accent"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {option.label}
            {uploadType === option.value && (
              <Loader2 className="ml-auto h-4 w-4 animate-spin" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Generate Individual</DropdownMenuLabel>
        {aspectRatioOptions.map((option) => (
          <DropdownMenuItem
            key={`generate-${option.value}`}
            onClick={() => handleGenerateImage(option.value)}
            disabled={isGenerating || postIsUploading}
            className="cursor-pointer focus:bg-accent"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {option.label}
            {isGenerating && (
              <span className="ml-auto text-xs text-muted-foreground">
                {generationStep}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};