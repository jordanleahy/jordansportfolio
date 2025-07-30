import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, ImageIcon, Loader2, Sparkles, ChevronDown } from 'lucide-react';
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

interface ImageUploadCardProps {
  title: string;
  aspectRatio: string;
  displayAspectRatio?: string;
  imageUrl?: string;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
  // For AI generation
  postData?: {
    id: string;
    title: string;
    description: string;
    category?: string;
  };
}

export const ImageUploadCard = ({ 
  title, 
  aspectRatio, 
  displayAspectRatio = "16/9",
  imageUrl, 
  onImageUpload, 
  onImageRemove,
  postData 
}: ImageUploadCardProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'prompt' | 'image' | 'upload' | null>(null);
  const { toast: toastHook } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFileToStorage(file);
      if (result.success && result.url) {
        onImageUpload(result.url);
        toastHook({
          title: "Image uploaded successfully",
          description: `${title} has been uploaded.`,
        });
      } else {
        toastHook({
          title: "Upload failed",
          description: result.error || "Failed to upload image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toastHook({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!postData) {
      toastHook({
        title: "Generation failed",
        description: "Post data is required for AI generation.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationStep('prompt');
      
      console.log('🎨 IMAGE_GENERATION: Starting generation for aspect:', aspectRatio);
      
      // Step 1: Generate prompt
      toast.info('Generating image prompt...');
      
      const promptResponse = await supabase.functions.invoke('generate-image-prompt-dynamic', {
        body: {
          title: postData.title,
          description: postData.description,
          category: postData.category || 'cdi',
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
      const fileName = `generated_${postData.id}_${aspectRatio}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Upload to storage
      const uploadResult = await uploadFileToStorage(file);
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Failed to upload generated image');
      }

      onImageUpload(uploadResult.url);
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
      if (generationStep === 'prompt') return 'Generating prompt...';
      if (generationStep === 'image') return 'Creating image...';
      if (generationStep === 'upload') return 'Processing...';
      return 'Generating...';
    }
    if (isUploading) return 'Uploading...';
    return 'Upload or Generate';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {imageUrl ? (
          <div className="relative">
            <div 
              className="w-full rounded-md border overflow-hidden bg-muted/10" 
              style={{ aspectRatio: displayAspectRatio }}
            >
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={onImageRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className={`border-2 border-dashed border-muted-foreground/25 rounded-md p-8 text-center`} style={{ aspectRatio: displayAspectRatio }}>
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">Upload {title}</p>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading || isGenerating}
              className="hidden"
              id={`upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploading || isGenerating}
                  className="gap-2"
                >
                  {(isUploading || isGenerating) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4" />
                  )}
                  {getLoadingText()}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel>Upload Image</DropdownMenuLabel>
                <DropdownMenuItem
                  asChild
                  disabled={isUploading || isGenerating}
                  className="cursor-pointer"
                >
                  <label htmlFor={`upload-${title.replace(/\s+/g, '-').toLowerCase()}`} className="w-full flex items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                    {isUploading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                  </label>
                </DropdownMenuItem>
                
                {postData && (
                  <>
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardContent>
    </Card>
  );
};