import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { ImageHoverOverlay } from '@/components/ui/image-hover-overlay';
import { Copy, Trash2, ImageIcon, Upload, Loader2, Lightbulb, NotebookPen, Mic } from 'lucide-react';
import { optimizedSocialMediaService } from '@/services/optimizedSocialMediaService';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ImagePromptModal } from './ImagePromptModal';
import { ImageWatermarkModal } from './ImageWatermarkModal';
import { ImagePreviewModal } from '@/components/ui/image-preview-modal';
import { PostCard } from './PostCard';
import { VoiceoverScriptModal } from '@/components/voiceover/VoiceoverScriptModal';
import type { SocialMediaPost } from '@/types/socialMedia';
interface PostsTableProps {
  posts: SocialMediaPost[];
  onPostsChange: () => void;
}
export const PostsTable = ({
  posts,
  onPostsChange
}: PostsTableProps) => {
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [creatingBlogIds, setCreatingBlogIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'draft' | 'published'>('draft');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file916InputRef = useRef<HTMLInputElement>(null);
  const file34InputRef = useRef<HTMLInputElement>(null);
  const file43InputRef = useRef<HTMLInputElement>(null);
  const [uploadingPostId, setUploadingPostId] = useState<string | null>(null);
  const [uploading916PostId, setUploading916PostId] = useState<string | null>(null);
  const [uploading34PostId, setUploading34PostId] = useState<string | null>(null);
  const [uploading43PostId, setUploading43PostId] = useState<string | null>(null);
  const [uploadingGeneralVideoPostId, setUploadingGeneralVideoPostId] = useState<string | null>(null);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'16_9' | '9_16' | '3_4' | '4_3'>('16_9');
  const [voiceoverModal, setVoiceoverModal] = useState<{
    isOpen: boolean;
    post: SocialMediaPost | null;
  }>({ isOpen: false, post: null });
  const [imagePromptModal, setImagePromptModal] = useState<{
    isOpen: boolean;
    postId: string;
    title: string;
    description: string;
    cachedPrompt?: string | null;
    category?: string;
  }>({
    isOpen: false,
    postId: '',
    title: '',
    description: '',
    cachedPrompt: null,
    category: 'cdi'
  });
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  // Filter posts by status
  const draftPosts = posts.filter(post => post.status === 'draft');
  const publishedPosts = posts.filter(post => post.status === 'published');
  const filteredPosts = activeTab === 'draft' ? draftPosts : publishedPosts;
  const handleStatusChange = async (postId: string, newStatus: 'draft' | 'scheduled' | 'published') => {
    try {
      await optimizedSocialMediaService.updatePost(postId, {
        status: newStatus
      });
      onPostsChange();
    } catch (error) {
      console.error('Error updating post status:', error);
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive"
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/20 text-green-700 border-green-500/20';
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/20';
      default:
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20';
    }
  };
  const handleCopyContent = async (post: SocialMediaPost) => {
    const content = `${post.title}\n\n${post.description}`;
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Content copied",
        description: "Post content has been copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive"
      });
    }
  };
  const handleDeletePost = async (postId: string) => {
    try {
      await optimizedSocialMediaService.deletePost(postId);
      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted."
      });
      onPostsChange();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the post.",
        variant: "destructive"
      });
    }
  };
  const handleGenerateVoiceoverScript = (post: SocialMediaPost) => {
    setVoiceoverModal({
      isOpen: true,
      post: post
    });
  };

  const handleGenerateImagePrompt = (post: SocialMediaPost) => {
    setImagePromptModal({
      isOpen: true,
      postId: post.id,
      title: post.title,
      description: post.description,
      cachedPrompt: post.generated_image_prompt,
      category: post.category
    });
  };
  const handleCreateBlogPost = async (post: SocialMediaPost) => {
    setCreatingBlogIds(prev => new Set(prev).add(post.id));
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to create blog posts');
      }
      const response = await supabase.functions.invoke('generic-blog', {
        body: {
          socialMediaPost: post
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (response.error) {
        throw response.error;
      }
      const {
        blogPost,
        redirectUrl
      } = response.data;
      toast({
        title: "Blog post created",
        description: "A draft blog post has been created. Redirecting to editor..."
      });

      // Navigate to blog editor with the new post
      setTimeout(() => {
        if (redirectUrl) {
          navigate(redirectUrl);
        } else {
          navigate(`/blog-editor/${blogPost.id}`);
        }
      }, 1000);
    } catch (error) {
      console.error('Error creating blog post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create blog post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreatingBlogIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  };
  const handleImageUpload = async (postId: string, file: File) => {
    setUploadingPostId(postId);
    try {
      // Find the post to get its title
      const post = posts.find(p => p.id === postId);

      // Sanitize the title for use as filename
      const sanitizeTitle = (title: string) => {
        return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim().replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      };
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId; // Fallback to postId if sanitization fails
      const fileName = `${baseName}_16_9_${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const {
        data: uploadData,
        error: uploadError
      } = await supabase.storage.from('images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (uploadError) throw uploadError;

      // Get the public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('images').getPublicUrl(fileName);

      // Update the post with the new image URL
      await optimizedSocialMediaService.updatePost(postId, {
        image_16_9_url: publicUrl
      });
      toast({
        title: "Image uploaded",
        description: "16:9 image has been successfully uploaded."
      });
      onPostsChange();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
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
        return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim().replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      };
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId; // Fallback to postId if sanitization fails
      const fileName = `${baseName}_9_16_${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const {
        data: uploadData,
        error: uploadError
      } = await supabase.storage.from('images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (uploadError) throw uploadError;

      // Get the public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('images').getPublicUrl(fileName);

      // Update the post with the new image URL
      await optimizedSocialMediaService.updatePost(postId, {
        image_9_16_url: publicUrl
      });
      toast({
        title: "Video uploaded",
        description: "16:9 video has been successfully uploaded."
      });
      onPostsChange();
    } catch (error) {
      console.error('Error uploading 9:16 image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload 16:9 video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading916PostId(null);
    }
  };
  const handleImage34Upload = async (postId: string, file: File) => {
    setUploading34PostId(postId);
    try {
      // Find the post to get its title
      const post = posts.find(p => p.id === postId);

      // Sanitize the title for use as filename
      const sanitizeTitle = (title: string) => {
        return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim().replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      };
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId; // Fallback to postId if sanitization fails
      const fileName = `${baseName}_3_4_${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const {
        data: uploadData,
        error: uploadError
      } = await supabase.storage.from('images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (uploadError) throw uploadError;

      // Get the public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('images').getPublicUrl(fileName);

      // Update the post with the new image URL
      await optimizedSocialMediaService.updatePost(postId, {
        image_3_4_url: publicUrl
      });
      toast({
        title: "Image uploaded",
        description: "3:4 image has been successfully uploaded."
      });
      onPostsChange();
    } catch (error) {
      console.error('Error uploading 3:4 image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload 3:4 image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading34PostId(null);
    }
  };
  const handleImage43Upload = async (postId: string, file: File) => {
    setUploading43PostId(postId);
    try {
      // Find the post to get its title
      const post = posts.find(p => p.id === postId);

      // Sanitize the title for use as filename
      const sanitizeTitle = (title: string) => {
        return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim().replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
      };
      const fileExt = file.name.split('.').pop();
      const sanitizedTitle = post ? sanitizeTitle(post.title) : '';
      const baseName = sanitizedTitle || postId; // Fallback to postId if sanitization fails
      const fileName = `${baseName}_4_3_${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const {
        data: uploadData,
        error: uploadError
      } = await supabase.storage.from('images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (uploadError) throw uploadError;

      // Get the public URL
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('images').getPublicUrl(fileName);

      // Update the post with the new image URL
      await optimizedSocialMediaService.updatePost(postId, {
        image_4_3_url: publicUrl
      });
      toast({
        title: "Video uploaded",
        description: "3:4 video has been successfully uploaded."
      });
      onPostsChange();
    } catch (error) {
      console.error('Error uploading 4:3 image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload 3:4 video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading43PostId(null);
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
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
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
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
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
  const handleFile34Select = (postId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      // Show watermark modal instead of direct upload
      const post = posts.find(p => p.id === postId);
      setSelectedPost(post || null);
      setSelectedFile(file);
      setUploadType('3_4');
      setShowWatermarkModal(true);
    }
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };
  const handleFile43Select = (postId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      // Show watermark modal instead of direct upload
      const post = posts.find(p => p.id === postId);
      setSelectedPost(post || null);
      setSelectedFile(file);
      setUploadType('4_3');
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
    } else if (uploadType === '9_16') {
      handleImage916Upload(selectedPost.id, watermarkedFile);
    } else if (uploadType === '3_4') {
      handleImage34Upload(selectedPost.id, watermarkedFile);
    } else {
      handleImage43Upload(selectedPost.id, watermarkedFile);
    }
  };

  // Video upload handlers
  const handleVideoUpload = async (postId: string, url: string, type: '16_9_video' | '3_4_video' | 'general_video') => {
    try {
      const updateData = type === '16_9_video' ? {
        image_16_9_video_url: url
      } : type === '3_4_video' ? {
        image_3_4_video_url: url
      } : {
        general_video_url: url
      };
      await optimizedSocialMediaService.updatePost(postId, updateData);
      toast({
        title: "Video uploaded",
        description: `${type === '16_9_video' ? '16:9' : type === '3_4_video' ? '3:4' : 'General'} video has been successfully uploaded.`
      });
      onPostsChange();
    } catch (error) {
      console.error('Error updating post with video:', error);
      toast({
        title: "Update failed",
        description: "Failed to save video URL.",
        variant: "destructive"
      });
    }
  };
  const handleVideoRemove = async (postId: string, type: '16_9_video' | '3_4_video' | 'general_video') => {
    try {
      const updateData = type === '16_9_video' ? {
        image_16_9_video_url: null
      } : type === '3_4_video' ? {
        image_3_4_video_url: null
      } : {
        general_video_url: null
      };
      await optimizedSocialMediaService.updatePost(postId, updateData);
      toast({
        title: "Video removed",
        description: `${type === '16_9_video' ? '16:9' : type === '3_4_video' ? '3:4' : 'General'} video has been removed.`
      });
      onPostsChange();
    } catch (error) {
      console.error('Error removing video:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove video.",
        variant: "destructive"
      });
    }
  };
  const handleImageDelete = async (postId: string, type: '16_9' | '9_16' | '3_4' | '4_3') => {
    try {
      const fieldName = `image_${type}_url`;
      await optimizedSocialMediaService.updatePost(postId, {
        [fieldName]: null
      });
      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
      onPostsChange();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Create unified file select handler for mobile cards
  const handleMobileFileSelect = (postId: string, event: React.ChangeEvent<HTMLInputElement>, type: '16_9' | '9_16' | '3_4' | '4_3') => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      // Show watermark modal
      const post = posts.find(p => p.id === postId);
      setSelectedPost(post || null);
      setSelectedFile(file);
      setUploadType(type);
      setShowWatermarkModal(true);
    }
  };

  // Create upload states object for mobile cards
  const uploadingStates = {
    [`${uploadingPostId}_16_9`]: !!uploadingPostId,
    [`${uploading916PostId}_9_16`]: !!uploading916PostId,
    [`${uploading34PostId}_3_4`]: !!uploading34PostId,
    [`${uploading43PostId}_4_3`]: !!uploading43PostId
  };
  if (posts.length === 0) {
    return <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No posts created yet. Create your first social media post above.</p>
        </CardContent>
      </Card>;
  }

  // Mobile layout with cards
  if (isMobile) {
    return <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Posts</h2>
          <span className="text-sm text-muted-foreground">{posts.length} posts</span>
        </div>
        
        <Tabs defaultValue="draft" onValueChange={value => setActiveTab(value as 'draft' | 'published')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draft">Draft ({draftPosts.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="draft" className="space-y-3 mt-4">
            {draftPosts.sort((a, b) => (a.day || 0) - (b.day || 0)).map(post => <PostCard key={post.id} post={post} onCopy={handleCopyContent} onDelete={handleDeletePost} onGeneratePrompt={handleGenerateImagePrompt} onGenerateVoiceover={handleGenerateVoiceoverScript} onFileSelect={handleMobileFileSelect} onVideoUpload={handleVideoUpload} onVideoRemove={handleVideoRemove} onImageDelete={handleImageDelete} onStatusChange={handleStatusChange} uploadingStates={uploadingStates} />)}
            {draftPosts.length === 0 && <p className="text-center text-muted-foreground py-8">No draft posts yet.</p>}
          </TabsContent>
          
          <TabsContent value="published" className="space-y-3 mt-4">
            {publishedPosts.sort((a, b) => (a.day || 0) - (b.day || 0)).map(post => <PostCard key={post.id} post={post} onCopy={handleCopyContent} onDelete={handleDeletePost} onGeneratePrompt={handleGenerateImagePrompt} onGenerateVoiceover={handleGenerateVoiceoverScript} onFileSelect={handleMobileFileSelect} onVideoUpload={handleVideoUpload} onVideoRemove={handleVideoRemove} onImageDelete={handleImageDelete} onStatusChange={handleStatusChange} uploadingStates={uploadingStates} />)}
            {publishedPosts.length === 0 && <p className="text-center text-muted-foreground py-8">No published posts yet.</p>}
          </TabsContent>
        </Tabs>

        <ImagePromptModal isOpen={imagePromptModal.isOpen} onClose={() => setImagePromptModal({
        isOpen: false,
        postId: '',
        title: '',
        description: '',
        cachedPrompt: null,
        category: 'cdi'
      })} title={imagePromptModal.title} description={imagePromptModal.description} postId={imagePromptModal.postId} cachedPrompt={imagePromptModal.cachedPrompt} category={imagePromptModal.category} />

        <ImageWatermarkModal isOpen={showWatermarkModal} onClose={() => setShowWatermarkModal(false)} file={selectedFile} onConfirm={handleWatermarkedUpload} />
      </div>;
  }

  // Desktop layout with table
  return <Card>
      <CardHeader>
        <CardTitle>Your Social Media Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="draft" onValueChange={value => setActiveTab(value as 'draft' | 'published')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="draft">Draft ({draftPosts.length})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedPosts.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="draft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                   <TableHead>16:9</TableHead>
                  <TableHead>9:16</TableHead>
                  <TableHead>3:4</TableHead>
                  <TableHead>4:3</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {draftPosts.sort((a, b) => (a.day || 0) - (b.day || 0)).map(post => <TableRow key={post.id}>
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
                        {post.description.length > 100 ? post.description.substring(0, 100) + '...' : post.description}
                      </div>
                      {post.description.length > 100 && <Button variant="ghost" size="sm" className="h-auto p-0 mt-1 text-xs text-primary" onClick={() => {
                    toast({
                      title: post.title,
                      description: post.description
                    });
                  }}>
                          Read more
                        </Button>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" onChange={e => handleFileSelect(post.id, e)} className="hidden" id={`upload-${post.id}`} />
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById(`upload-${post.id}`)?.click()} title="Click to upload 16:9 image">
                          {post.image_16_9_url ? <ImageHoverOverlay onUpload={() => document.getElementById(`upload-${post.id}`)?.click()} onView={() => setPreviewImage({
                        url: post.image_16_9_url!,
                        alt: "16:9 image for " + post.title
                      })} onDelete={() => handleImageDelete(post.id, '16_9')} imageUrl={post.image_16_9_url}>
                              <OptimizedImage src={post.image_16_9_url} alt="16:9 Image" aspectRatio="16/9" className="w-20 h-auto rounded border cursor-pointer" />
                            </ImageHoverOverlay> : <div className="w-20 h-12 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploadingPostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <>
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground ml-1">16:9</span>
                                </>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" onChange={e => handleFile916Select(post.id, e)} className="hidden" id={`upload-916-${post.id}`} />
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById(`upload-916-${post.id}`)?.click()} title="Click to upload 9:16 video">
                          {post.image_9_16_url ? <ImageHoverOverlay onUpload={() => document.getElementById(`upload-916-${post.id}`)?.click()} onView={() => setPreviewImage({
                        url: post.image_9_16_url!,
                        alt: "16:9 video for " + post.title
                      })} onDelete={() => handleImageDelete(post.id, '9_16')} imageUrl={post.image_9_16_url}>
                              <OptimizedImage src={post.image_9_16_url} alt="16:9 Video" aspectRatio="9/16" className="w-12 h-auto rounded border cursor-pointer" />
                            </ImageHoverOverlay> : <div className="w-12 h-20 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploading916PostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <div className="flex flex-col items-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">16:9</span>
                                </div>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" onChange={e => handleFile34Select(post.id, e)} className="hidden" id={`upload-34-${post.id}`} />
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById(`upload-34-${post.id}`)?.click()} title="Click to upload 3:4 image">
                          {post.image_3_4_url ? <ImageHoverOverlay onUpload={() => document.getElementById(`upload-34-${post.id}`)?.click()} onView={() => setPreviewImage({
                        url: post.image_3_4_url!,
                        alt: "3:4 image for " + post.title
                      })} onDelete={() => handleImageDelete(post.id, '3_4')} imageUrl={post.image_3_4_url}>
                              <OptimizedImage src={post.image_3_4_url} alt="3:4 Image" aspectRatio="3/4" className="w-16 h-auto rounded border cursor-pointer" />
                            </ImageHoverOverlay> : <div className="w-16 h-20 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploading34PostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <div className="flex flex-col items-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">3:4</span>
                                </div>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" onChange={e => handleFile43Select(post.id, e)} className="hidden" id={`upload-43-${post.id}`} />
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById(`upload-43-${post.id}`)?.click()} title="Click to upload 3:4 video">
                          {post.image_4_3_url ? <ImageHoverOverlay onUpload={() => document.getElementById(`upload-43-${post.id}`)?.click()} onView={() => setPreviewImage({
                        url: post.image_4_3_url!,
                        alt: "3:4 video for " + post.title
                      })} onDelete={() => handleImageDelete(post.id, '4_3')} imageUrl={post.image_4_3_url}>
                              <OptimizedImage src={post.image_4_3_url} alt="3:4 Video" aspectRatio="4/3" className="w-20 h-auto rounded border cursor-pointer" />
                            </ImageHoverOverlay> : <div className="w-20 h-16 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploading43PostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <div className="flex flex-col items-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">3:4 Vid</span>
                                </div>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={async () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'video/*,.mp4,.webm,.mov,.avi,.ogg,.mkv';
                      input.onchange = async e => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          console.log('Video file selected:', file.name, file.type, file.size);
                          setUploadingGeneralVideoPostId(post.id);
                          try {
                            const {
                              uploadVideoToStorage
                            } = await import('@/utils/videoUpload');
                            console.log('Starting video upload...');
                            const result = await uploadVideoToStorage(file);
                            console.log('Upload result:', result);
                            if (result.success && result.url) {
                              console.log('Updating post with video URL:', result.url);
                              await handleVideoUpload(post.id, result.url, 'general_video');
                              toast({
                                title: "Success",
                                description: "Video uploaded successfully"
                              });
                            } else {
                              console.error('Upload failed:', result.error);
                              toast({
                                title: "Upload failed",
                                description: result.error || "Failed to upload video",
                                variant: "destructive"
                              });
                            }
                          } catch (error) {
                            console.error('Error uploading video:', error);
                            toast({
                              title: "Upload failed",
                              description: "Failed to upload video",
                              variant: "destructive"
                            });
                          } finally {
                            setUploadingGeneralVideoPostId(null);
                          }
                        }
                      };
                      input.click();
                    }} title="Click to upload general video">
                          {post.general_video_url ? <div className="relative">
                              <video src={post.general_video_url} className="w-20 h-15 rounded border cursor-pointer object-cover" preload="metadata" onClick={() => setPreviewImage({
                          url: post.general_video_url!,
                          alt: "General video for " + post.title
                        })} />
                            </div> : <div className="w-20 h-15 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploadingGeneralVideoPostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <div className="flex flex-col items-center">
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">Video</span>
                                </div>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(post.status)} cursor-pointer hover:opacity-80 transition-opacity`} onClick={() => {
                    if (post.status === 'draft') {
                      handleStatusChange(post.id, 'published');
                      toast({
                        title: "Status Updated",
                        description: "Post marked as published"
                      });
                    }
                  }}>
                        {post.status === 'published' ? new Date(post.updated_at).toLocaleDateString() : post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(post.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleCreateBlogPost(post)} title="Create blog post" disabled={creatingBlogIds.has(post.id)}>
                          {creatingBlogIds.has(post.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleGenerateImagePrompt(post)} title="Generate image prompt" className="flex items-center gap-1">
                          <Lightbulb className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleGenerateVoiceoverScript(post)} title="Generate voiceover script">
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCopyContent(post)} title="Copy content to clipboard">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeletePost(post.id)} title="Delete post">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
                {draftPosts.length === 0 && <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No draft posts yet.
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="published">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>16:9 Image</TableHead>
                  <TableHead>16:9</TableHead>
                  <TableHead>3:4 Image</TableHead>
                  <TableHead>3:4 Vid</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishedPosts.sort((a, b) => (a.day || 0) - (b.day || 0)).map(post => <TableRow key={post.id}>
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
                        {post.description.length > 100 ? post.description.substring(0, 100) + '...' : post.description}
                      </div>
                      {post.description.length > 100 && <Button variant="ghost" size="sm" className="h-auto p-0 mt-1 text-xs text-primary" onClick={() => {
                    toast({
                      title: post.title,
                      description: post.description
                    });
                  }}>
                          Read more
                        </Button>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" onChange={e => handleFileSelect(post.id, e)} className="hidden" id={`upload-pub-${post.id}`} />
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById(`upload-pub-${post.id}`)?.click()} title="Click to upload 16:9 image">
                          {post.image_16_9_url ? <ImageHoverOverlay onUpload={() => document.getElementById(`upload-pub-${post.id}`)?.click()} onView={() => setPreviewImage({
                        url: post.image_16_9_url!,
                        alt: "16:9 image for " + post.title
                      })} onDelete={() => handleImageDelete(post.id, '16_9')} imageUrl={post.image_16_9_url}>
                              <OptimizedImage src={post.image_16_9_url} alt="16:9 Image" aspectRatio="16/9" className="w-20 h-auto rounded border cursor-pointer" />
                            </ImageHoverOverlay> : <div className="w-20 h-12 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploadingPostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <>
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground ml-1">16:9</span>
                                </>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" onChange={e => handleFile916Select(post.id, e)} className="hidden" id={`upload-916-pub-${post.id}`} />
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById(`upload-916-pub-${post.id}`)?.click()} title="Click to upload 9:16 video">
                          {post.image_9_16_url ? <ImageHoverOverlay onUpload={() => document.getElementById(`upload-916-pub-${post.id}`)?.click()} onView={() => setPreviewImage({
                        url: post.image_9_16_url!,
                        alt: "16:9 video for " + post.title
                      })} onDelete={() => handleImageDelete(post.id, '9_16')} imageUrl={post.image_9_16_url}>
                              <OptimizedImage src={post.image_9_16_url} alt="16:9 Video" aspectRatio="9/16" className="w-12 h-auto rounded border cursor-pointer" />
                            </ImageHoverOverlay> : <div className="w-12 h-20 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploading916PostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <div className="flex flex-col items-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">16:9</span>
                                </div>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" onChange={e => handleFile34Select(post.id, e)} className="hidden" id={`upload-34-pub-${post.id}`} />
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById(`upload-34-pub-${post.id}`)?.click()} title="Click to upload 3:4 image">
                          {post.image_3_4_url ? <ImageHoverOverlay onUpload={() => document.getElementById(`upload-34-pub-${post.id}`)?.click()} onView={() => setPreviewImage({
                        url: post.image_3_4_url!,
                        alt: "3:4 image for " + post.title
                      })} onDelete={() => handleImageDelete(post.id, '3_4')} imageUrl={post.image_3_4_url}>
                              <OptimizedImage src={post.image_3_4_url} alt="3:4 Image" aspectRatio="3/4" className="w-16 h-auto rounded border cursor-pointer" />
                            </ImageHoverOverlay> : <div className="w-16 h-20 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploading34PostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <div className="flex flex-col items-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">3:4</span>
                                </div>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/*" onChange={e => handleFile43Select(post.id, e)} className="hidden" id={`upload-43-pub-${post.id}`} />
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => document.getElementById(`upload-43-pub-${post.id}`)?.click()} title="Click to upload 3:4 video">
                          {post.image_4_3_url ? <ImageHoverOverlay onUpload={() => document.getElementById(`upload-43-pub-${post.id}`)?.click()} onView={() => setPreviewImage({
                        url: post.image_4_3_url!,
                        alt: "3:4 video for " + post.title
                      })} onDelete={() => handleImageDelete(post.id, '4_3')} imageUrl={post.image_4_3_url}>
                              <OptimizedImage src={post.image_4_3_url} alt="3:4 Video" aspectRatio="4/3" className="w-20 h-auto rounded border cursor-pointer" />
                            </ImageHoverOverlay> : <div className="w-20 h-16 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploading43PostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <div className="flex flex-col items-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">3:4 Vid</span>
                                </div>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={async () => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'video/*,.mp4,.webm,.mov,.avi,.ogg,.mkv';
                      input.onchange = async e => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          setUploadingGeneralVideoPostId(post.id);
                          try {
                            const {
                              uploadVideoToStorage
                            } = await import('@/utils/videoUpload');
                            const result = await uploadVideoToStorage(file);
                            if (result.success && result.url) {
                              await handleVideoUpload(post.id, result.url, 'general_video');
                              toast({
                                title: "Success",
                                description: "Video uploaded successfully"
                              });
                            } else {
                              toast({
                                title: "Upload failed",
                                description: result.error || "Failed to upload video",
                                variant: "destructive"
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Upload failed",
                              description: "Failed to upload video",
                              variant: "destructive"
                            });
                          } finally {
                            setUploadingGeneralVideoPostId(null);
                          }
                        }
                      };
                      input.click();
                    }} title="Click to upload general video">
                          {post.general_video_url ? <div className="relative">
                              <video src={post.general_video_url} className="w-20 h-15 rounded border cursor-pointer object-cover" preload="metadata" onClick={() => setPreviewImage({
                          url: post.general_video_url!,
                          alt: "General video for " + post.title
                        })} />
                            </div> : <div className="w-20 h-15 rounded border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                              {uploadingGeneralVideoPostId === post.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <div className="flex flex-col items-center">
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">Video</span>
                                </div>}
                            </div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(post.status)} cursor-pointer hover:opacity-80 transition-opacity`} onClick={() => {
                    if (post.status === 'published') {
                      handleStatusChange(post.id, 'draft');
                      toast({
                        title: "Status Updated",
                        description: "Post marked as draft"
                      });
                    }
                  }}>
                        {post.status === 'published' ? new Date(post.updated_at).toLocaleDateString() : post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(post.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleCreateBlogPost(post)} title="Create blog post" disabled={creatingBlogIds.has(post.id)}>
                          {creatingBlogIds.has(post.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleGenerateImagePrompt(post)} title="Generate image prompt" className="flex items-center gap-1">
                          <Lightbulb className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleGenerateVoiceoverScript(post)} title="Generate voiceover script">
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCopyContent(post)} title="Copy content to clipboard">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeletePost(post.id)} title="Delete post">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
                {publishedPosts.length === 0 && <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No published posts yet.
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <ImagePromptModal isOpen={imagePromptModal.isOpen} onClose={() => setImagePromptModal({
      isOpen: false,
      postId: '',
      title: '',
      description: '',
      cachedPrompt: null,
      category: 'cdi'
    })} title={imagePromptModal.title} description={imagePromptModal.description} postId={imagePromptModal.postId} cachedPrompt={imagePromptModal.cachedPrompt} category={imagePromptModal.category} />

      <ImageWatermarkModal isOpen={showWatermarkModal} onClose={() => setShowWatermarkModal(false)} file={selectedFile} onConfirm={handleWatermarkedUpload} />

      {voiceoverModal.isOpen && voiceoverModal.post && (
        <VoiceoverScriptModal
          isOpen={voiceoverModal.isOpen}
          onClose={() => setVoiceoverModal({ isOpen: false, post: null })}
          sourceId={voiceoverModal.post.id}
          sourceType="social_media_post"
          originalContent={`${voiceoverModal.post.title}\n\n${voiceoverModal.post.description}`}
          contentType="calendar_entry"
        />
      )}

      {previewImage && <ImagePreviewModal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} imageUrl={previewImage.url} alt={previewImage.alt} />}
    </Card>;
};