import React, { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SocialMediaPost } from '@/types/socialMedia';

type AspectRatio = '16_9' | '9_16' | '3_4' | '4_3';

interface SimplifiedUploadDropdownProps {
  post: SocialMediaPost;
  isUploading: (postId: string, aspectRatio?: AspectRatio) => boolean;
  getUploadType: (postId: string) => AspectRatio | null;
  onFileSelect: (postId: string, aspectRatio: AspectRatio) => void;
  onPostsChange?: () => void;
}

export const SimplifiedUploadDropdown: React.FC<SimplifiedUploadDropdownProps> = ({
  post,
  isUploading,
  getUploadType,
  onFileSelect,
  onPostsChange,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'prompt' | 'image' | 'upload' | null>(null);
  
  const postIsUploading = isUploading(post.id);
  const uploadType = getUploadType(post.id);

  const aspectRatioOptions = [
    { value: '16_9' as const, label: '16:9 (Landscape)' },
    { value: '9_16' as const, label: '9:16 (Portrait)' },
    { value: '3_4' as const, label: '3:4 (Portrait)' },
    { value: '4_3' as const, label: '4:3 (Landscape)' },
  ];

  const handleGenerateImage = async (aspectRatio: AspectRatio) => {
    try {
      setIsGenerating(true);
      setGenerationStep('prompt');
      
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
      setGenerationStep('image');
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
      setGenerationStep('upload');
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
      onPostsChange?.();

    } catch (error) {
      console.error('🎨 IMAGE_GENERATION: Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
      setGenerationStep(null);
    }
  };

  const getLoadingText = () => {
    if (generationStep === 'prompt') return 'Generating prompt...';
    if (generationStep === 'image') return 'Creating image...';
    if (generationStep === 'upload') return 'Processing...';
    return 'Upload or Generate';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" title={getLoadingText()}>
          {(postIsUploading || isGenerating) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
            className="cursor-pointer"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {option.label}
            {uploadType === option.value && (
              <Loader2 className="ml-auto h-4 w-4 animate-spin" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Generate with AI</DropdownMenuLabel>
        {aspectRatioOptions.map((option) => (
          <DropdownMenuItem
            key={`generate-${option.value}`}
            onClick={() => handleGenerateImage(option.value)}
            disabled={isGenerating || postIsUploading}
            className="cursor-pointer"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {option.label}
            {isGenerating && (
              <span className="ml-auto text-xs text-muted-foreground">
                {generationStep === 'prompt' && 'Prompt...'}
                {generationStep === 'image' && 'Image...'}
                {generationStep === 'upload' && 'Upload...'}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};