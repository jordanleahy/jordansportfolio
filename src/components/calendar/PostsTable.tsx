import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Copy, Trash2, ImageIcon, Upload, Loader2, Lightbulb } from 'lucide-react';
import { socialMediaService } from '@/services/socialMediaService';
import { useToast } from '@/hooks/use-toast';
import { ImagePromptModal } from './ImagePromptModal';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostsTableProps {
  posts: SocialMediaPost[];
  onPostsChange: () => void;
}

export const PostsTable = ({ posts, onPostsChange }: PostsTableProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPostId, setUploadingPostId] = useState<string | null>(null);
  const [imagePromptModal, setImagePromptModal] = useState<{
    isOpen: boolean;
    postId: string;
    title: string;
    description: string;
    cachedPrompt?: string | null;
  }>({
    isOpen: false,
    postId: '',
    title: '',
    description: '',
    cachedPrompt: null
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-700 border-green-500/20';
      case 'scheduled': return 'bg-blue-500/20 text-blue-700 border-blue-500/20';
      default: return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20';
    }
  };

  const handleCopyContent = async (post: SocialMediaPost) => {
    const content = `${post.title}\n\n${post.description}`;
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Content copied",
        description: "Post content has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await socialMediaService.deletePost(postId);
      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted.",
      });
      onPostsChange();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the post.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateImagePrompt = (post: SocialMediaPost) => {
    setImagePromptModal({
      isOpen: true,
      postId: post.id,
      title: post.title,
      description: post.description,
      cachedPrompt: post.generated_image_prompt
    });
  };

  const handleImageUpload = async (postId: string, file: File) => {
    setUploadingPostId(postId);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${postId}_16_9_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // Update the post with the new image URL
      await socialMediaService.updatePost(postId, {
        image_16_9_url: publicUrl
      });

      toast({
        title: "Image uploaded",
        description: "16:9 image has been successfully uploaded.",
      });

      onPostsChange();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPostId(null);
    }
  };

  const handleFileSelect = (postId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      handleImageUpload(postId, file);
    }
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No posts created yet. Create your first social media post above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Social Media Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>16:9 Image</TableHead>
              <TableHead>3:4 Image</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.sort((a, b) => (a.day || 0) - (b.day || 0)).map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">
                  {post.day || '-'}
                </TableCell>
                <TableCell className="font-medium max-w-xs">
                  <div className="truncate" title={post.title}>
                    {post.title}
                  </div>
                </TableCell>
                <TableCell className="max-w-sm">
                  <div className="truncate" title={post.description}>
                    {post.description}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(post.id, e)}
                      className="hidden"
                      id={`upload-${post.id}`}
                    />
                    <div 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => document.getElementById(`upload-${post.id}`)?.click()}
                      title="Click to upload 16:9 image"
                    >
                      {post.image_16_9_url ? (
                        <OptimizedImage
                          src={post.image_16_9_url}
                          alt="16:9 Image"
                          aspectRatio="16/9"
                          className="w-20 h-auto rounded border"
                        />
                      ) : (
                        <div className="w-20 h-12 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                          {uploadingPostId === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground ml-1">16:9</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {post.image_3_4_url && (
                    <OptimizedImage
                      src={post.image_3_4_url}
                      alt="3:4 Image"
                      aspectRatio="3/4"
                      className="w-16 h-auto rounded border"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(post.status)}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(post.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateImagePrompt(post)}
                      title="Generate image prompt"
                    >
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyContent(post)}
                      title="Copy content to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePost(post.id)}
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      
      <ImagePromptModal
        isOpen={imagePromptModal.isOpen}
        onClose={() => setImagePromptModal({ 
          isOpen: false, 
          postId: '', 
          title: '', 
          description: '', 
          cachedPrompt: null 
        })}
        title={imagePromptModal.title}
        description={imagePromptModal.description}
        postId={imagePromptModal.postId}
        cachedPrompt={imagePromptModal.cachedPrompt}
      />
    </Card>
  );
};