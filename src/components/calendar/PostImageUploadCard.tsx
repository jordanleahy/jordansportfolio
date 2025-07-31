import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SplitButton } from '@/components/ui/split-button';
import { Upload, Sparkles, Loader2, ChevronDown, X } from 'lucide-react';
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
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostImageUploadCardProps {
  post: SocialMediaPost;
  type: '16_9' | '9_16' | '3_4' | '4_3';
  label: string;
  imageUrl?: string;
  isUploading: boolean;
  onFileSelect: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', post: SocialMediaPost) => void;
  onImageDelete?: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3') => void;
  onImageGenerated: (postId: string, aspectRatio: '16_9' | '9_16' | '3_4' | '4_3', imageUrl: string) => void;
}

export const PostImageUploadCard = ({ 
  post,
  type,
  label,
  imageUrl,
  isUploading,
  onFileSelect,
  onImageDelete,
  onImageGenerated
}: PostImageUploadCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'prompt' | 'image' | 'upload' | null>(null);
  const { toast: toastHook } = useToast();

  const aspectRatioMap = {
    '16_9': '16:9',
    '9_16': '9:16', 
    '3_4': '3:4',
    '4_3': '4:3'
  };

  const aspectRatio = aspectRatioMap[type];

  const handleGenerateImage = async () => {
    if (!post.title || !post.description) {
      toastHook({
        title: "Generation failed",
        description: "Post must have title and description for AI generation.",
        variant: "destructive",
      });
      return;
    }

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
          aspectRatio: aspectRatio
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

      // Step 2: Generate image
      setGenerationStep('image');
      toast.info('Generating image with AI...');

      const imageResponse = await supabase.functions.invoke('generate-image-gpt', {
        body: {
          prompt: generatedPrompt,
          aspectRatio: aspectRatio
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
      const fileName = `generated_${post.id}_${type}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Upload to storage
      const uploadResult = await uploadFileToStorage(file);
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload generated image');
      }

      // Update the post with the new image URL
      const updateField = `image_${type}_url`;
      const { error: updateError } = await supabase
        .from('social_media_posts')
        .update({ [updateField]: uploadResult.url })
        .eq('id', post.id);

      if (updateError) {
        throw new Error(`Failed to update post: ${updateError.message}`);
      }

      onImageGenerated(post.id, type, uploadResult.url);
      toast.success('Image generated and uploaded successfully!');

    } catch (error) {
      console.error('🎨 IMAGE_GENERATION: Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
      setGenerationStep(null);
    }
  };

  const getLoadingText = () => {
    if (isGenerating) {
      if (generationStep === 'prompt') return 'Creating...';
      if (generationStep === 'image') return 'Generating...';
      if (generationStep === 'upload') return 'Uploading...';
      return 'Processing...';
    }
    if (isUploading) return 'Uploading...';
    return '';
  };

  const handleDeleteImage = () => {
    if (onImageDelete) {
      onImageDelete(post.id, type);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <SplitButton
          variant="outline"
          size="sm"
          primaryAction={{
            onClick: handleGenerateImage,
            disabled: isUploading || isGenerating,
            loading: isGenerating,
            children: isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />,
            title: `Generate ${aspectRatio} image`
          }}
          dropdownTrigger={{
            disabled: isUploading || isGenerating,
            children: <ChevronDown className="h-4 w-4" />,
            title: "More options"
          }}
          dropdownContent={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="absolute inset-0 w-full h-full" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
                <DropdownMenuLabel>Upload Image</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onFileSelect(post.id, type, post)}
                  disabled={isUploading || isGenerating}
                  className="cursor-pointer"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                  {isUploading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Generate with AI</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleGenerateImage}
                  disabled={isGenerating || isUploading}
                  className="cursor-pointer"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate ({aspectRatio})
                  {isGenerating && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {generationStep === 'prompt' && 'Prompt...'}
                      {generationStep === 'image' && 'Image...'}
                      {generationStep === 'upload' && 'Upload...'}
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </div>
      
      {imageUrl && (
        <div className="relative">
          <img
            src={imageUrl}
            alt={`${label} for ${post.title}`}
            className="w-full h-16 object-cover rounded border"
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
      )}
    </div>
  );
};