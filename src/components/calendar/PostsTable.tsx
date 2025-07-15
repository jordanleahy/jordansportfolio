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
import { ImageWatermarkModal } from './ImageWatermarkModal';
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
  const [uploading916PostId, setUploading916PostId] = useState<string | null>(null);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'16_9' | '9_16'>('16_9');
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
      // Find the post to get its title
      const post = posts.find(p => p.id === postId);
      
      // Sanitize the title for use as filename
      const sanitizeTitle = (title: string) => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .trim()
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .substring(0, 50); // Limit length
      };
      
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId; // Fallback to postId if sanitization fails
      const fileName = `${baseName}_16_9_${Date.now()}.${fileExt}`;
      
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

  const handleImage916Upload = async (postId: string, file: File) => {
    setUploading916PostId(postId);
    try {
      // Find the post to get its title
      const post = posts.find(p => p.id === postId);
      
      // Sanitize the title for use as filename
      const sanitizeTitle = (title: string) => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .trim()
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .substring(0, 50); // Limit length
      };
      
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId; // Fallback to postId if sanitization fails
      const fileName = `${baseName}_9_16_${Date.now()}.${fileExt}`;
      
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
        image_9_16_url: publicUrl
      });

      toast({
        title: "Image uploaded",
        description: "9:16 image has been successfully uploaded.",
      });

      onPostsChange();
    } catch (error) {
      console.error('Error uploading 9:16 image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload 9:16 image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading916PostId(null);
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

      // Show watermark modal instead of direct upload
      const post = posts.find(p => p.id === postId);
      setSelectedPost(post || null);
      setSelectedFile(file);
      setUploadType('16_9');
      setShowWatermarkModal(true);
    }
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleFile916Select = (postId: string, event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Show watermark modal instead of direct upload
      const post = posts.find(p => p.id === postId);
      setSelectedPost(post || null);
      setSelectedFile(file);
      setUploadType('9_16');
      setShowWatermarkModal(true);
    }
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleWatermarkedUpload = (watermarkedFile: File) => {
    if (!selectedPost) return;

    if (uploadType === '16_9') {
      handleImageUpload(selectedPost.id, watermarkedFile);
    } else {
      handleImage916Upload(selectedPost.id, watermarkedFile);
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
              <TableHead>9:16 Image</TableHead>
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
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile916Select(post.id, e)}
                      className="hidden"
                      id={`upload-916-${post.id}`}
                    />
                    <div 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => document.getElementById(`upload-916-${post.id}`)?.click()}
                      title="Click to upload 9:16 image"
                    >
                      {post.image_9_16_url ? (
                        <OptimizedImage
                          src={post.image_9_16_url}
                          alt="9:16 Image"
                          aspectRatio="9/16"
                          className="w-12 h-auto rounded border"
                        />
                      ) : (
                        <div className="w-12 h-20 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                          {uploading916PostId === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <div className="flex flex-col items-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">9:16</span>
                            </div>
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

      <ImageWatermarkModal
        isOpen={showWatermarkModal}
        onClose={() => setShowWatermarkModal(false)}
        file={selectedFile}
        onConfirm={handleWatermarkedUpload}
      />
    </Card>
  );
};