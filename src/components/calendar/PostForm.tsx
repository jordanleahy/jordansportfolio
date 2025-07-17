import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUploadCard } from './ImageUploadCard';
import { socialMediaService } from '@/services/socialMediaService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import type { CreateSocialMediaPost, PostStatus } from '@/types/socialMedia';

interface PostFormProps {
  onPostCreated: () => void;
  category?: 'cdi' | 'contracts';
}

export const PostForm = ({ onPostCreated, category = 'cdi' }: PostFormProps) => {
  const [formData, setFormData] = useState<CreateSocialMediaPost>({
    title: '',
    description: '',
    status: 'draft',
    category,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingField, setGeneratingField] = useState<string>('');
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await socialMediaService.createPost(formData);
      toast({
        title: "Post created successfully",
        description: "Your social media post has been saved.",
      });
      setFormData({
        title: '',
        description: '',
        status: 'draft',
        category,
      });
      setIsOpen(false);
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateContent = async (type: 'title' | 'description' | 'complete', prompt?: string) => {
    if (!prompt && type !== 'complete') {
      toast({
        title: "Input Required",
        description: "Please provide a topic or description to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratingField(type);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: prompt || `Generate ${type} for: ${formData.title || formData.description || 'a social media post'}`,
          type: type
        }
      });

      if (error) throw error;

      if (type === 'complete' && data.title && data.description) {
        setFormData(prev => ({
          ...prev,
          title: data.title,
          description: data.description
        }));
        toast({
          title: "Content Generated",
          description: "Both title and description have been generated with AI.",
        });
      } else if (data.content) {
        setFormData(prev => ({
          ...prev,
          [type]: data.content
        }));
        toast({
          title: "Content Generated",
          description: `AI-generated ${type} has been added.`,
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGeneratingField('');
    }
  };

  const handleGenerateFromPrompt = () => {
    const prompt = window.prompt("Describe your post topic or content:");
    if (prompt) {
      generateContent('complete', prompt);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Create New Post
        </Button>
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'max-w-full h-full sm:max-w-4xl sm:h-auto' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>Create New Social Media Post</DialogTitle>
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateFromPrompt}
              disabled={isGenerating}
              className={`${isMobile ? 'flex-1 h-12 text-base' : 'flex-1'}`}
            >
              {isGenerating && generatingField === 'complete' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isMobile ? 'Generate Post with AI' : 'Generate with AI'}
            </Button>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <div className="flex gap-2">
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  onClick={() => {
                    const topic = formData.description || window.prompt("What's your post about?");
                    if (topic) generateContent('title', topic);
                  }}
                  disabled={isGenerating}
                  title="Generate title with AI"
                  className={isMobile ? "h-10 px-4" : ""}
                >
                  {isGenerating && generatingField === 'title' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isMobile && <span className="ml-2">AI</span>}
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value: PostStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Description</label>
              <Button
                type="button"
                variant="outline"
                size={isMobile ? "default" : "sm"}
                onClick={() => {
                  const topic = formData.title || window.prompt("What's your post about?");
                  if (topic) generateContent('description', topic);
                }}
                disabled={isGenerating}
                title="Generate description with AI"
                className={isMobile ? "h-10 px-4" : ""}
              >
                {isGenerating && generatingField === 'description' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span className="ml-1">AI</span>
              </Button>
            </div>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter post description"
              rows={4}
              required
            />
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
            <ImageUploadCard
              title="16:9 Vid"
              aspectRatio="16/9"
              imageUrl={formData.image_16_9_url}
              onImageUpload={(url) => setFormData(prev => ({ ...prev, image_16_9_url: url }))}
              onImageRemove={() => setFormData(prev => ({ ...prev, image_16_9_url: undefined }))}
            />
            <ImageUploadCard
              title="3:4 Vid"
              aspectRatio="3/4"
              imageUrl={formData.image_3_4_url}
              onImageUpload={(url) => setFormData(prev => ({ ...prev, image_3_4_url: url }))}
              onImageRemove={() => setFormData(prev => ({ ...prev, image_3_4_url: undefined }))}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className={`w-full ${isMobile ? 'h-12 text-base' : ''}`}
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};