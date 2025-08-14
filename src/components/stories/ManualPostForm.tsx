import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { usePromptValidatedImageGeneration } from '@/hooks/usePromptValidatedImageGeneration';
import { GenerationProgress } from '@/components/ui/generation-progress';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import type { CreateSocialMediaPost } from '@/types/socialMedia';

interface ManualPostFormProps {
  category?: string;
  themeId?: string;
  onPostCreated?: () => void;
}

interface FormData {
  title: string;
  description: string;
}

export const ManualPostForm: React.FC<ManualPostFormProps> = ({
  category = 'manual',
  themeId,
  onPostCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdPost, setCreatedPost] = useState<any>(null);
  const { toast } = useToast();
  
  const { isGenerating, generationStep, generateHeroImage, steps } = usePromptValidatedImageGeneration();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsCreating(true);
    
    try {
      const postData: CreateSocialMediaPost = {
        title: data.title,
        description: data.description,
        category,
        theme_id: themeId,
        status: 'draft'
      };

      const newPost = await optimizedSocialMediaService.createPost(postData);
      setCreatedPost(newPost);
      
      toast({
        title: "Post created successfully",
        description: "Starting image prompt generation...",
      });
      
      // Trigger image generation
      await generateHeroImage(newPost, undefined, onPostCreated);
      
      // Reset form and close modal
      reset();
      setIsOpen(false);
      setCreatedPost(null);
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const currentSteps = [
    {
      key: 'creation',
      label: 'Creating Post',
      icon: Plus,
      isComplete: createdPost !== null,
      isActive: isCreating && !createdPost
    },
    {
      key: 'promptValidation',
      label: 'Validating Prompt',
      icon: Loader2,
      isComplete: steps.promptValidation === 'complete',
      isActive: steps.promptValidation === 'active'
    },
    {
      key: 'promptGeneration',
      label: 'Generating Prompt',
      icon: Loader2,
      isComplete: steps.promptGeneration === 'complete',
      isActive: steps.promptGeneration === 'active'
    },
    {
      key: 'imageGeneration',
      label: 'Generating Image',
      icon: Loader2,
      isComplete: steps.imageGeneration === 'complete',
      isActive: steps.imageGeneration === 'active'
    },
    {
      key: 'imageUpload',
      label: 'Uploading Image',
      icon: Loader2,
      isComplete: steps.imageUpload === 'complete',
      isActive: steps.imageUpload === 'active'
    }
  ];

  const isProcessing = isCreating || isGenerating;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="Enter post title..."
                disabled={isProcessing}
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                placeholder="Enter post description..."
                rows={4}
                disabled={isProcessing}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing...</CardTitle>
              </CardHeader>
              <CardContent>
                <GenerationProgress 
                  currentStep={generationStep as "prompt" | "image" | "upload" | "complete"}
                  variant="default"
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isCreating ? 'Creating...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Post
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};