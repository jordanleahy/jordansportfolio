import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploadCard } from './ImageUploadCard';
import { socialMediaService } from '@/services/socialMediaService';
import { useToast } from '@/hooks/use-toast';
import type { CreateSocialMediaPost, PostStatus } from '@/types/socialMedia';

interface PostFormProps {
  onPostCreated: () => void;
}

export const PostForm = ({ onPostCreated }: PostFormProps) => {
  const [formData, setFormData] = useState<CreateSocialMediaPost>({
    title: '',
    description: '',
    status: 'draft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Social Media Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter post title"
                required
              />
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
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter post description"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUploadCard
              title="16:9 Image"
              aspectRatio="16/9"
              imageUrl={formData.image_16_9_url}
              onImageUpload={(url) => setFormData(prev => ({ ...prev, image_16_9_url: url }))}
              onImageRemove={() => setFormData(prev => ({ ...prev, image_16_9_url: undefined }))}
            />
            <ImageUploadCard
              title="3:4 Image"
              aspectRatio="3/4"
              imageUrl={formData.image_3_4_url}
              onImageUpload={(url) => setFormData(prev => ({ ...prev, image_3_4_url: url }))}
              onImageRemove={() => setFormData(prev => ({ ...prev, image_3_4_url: undefined }))}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};