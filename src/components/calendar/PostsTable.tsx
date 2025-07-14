import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Copy, Trash2, ImageIcon } from 'lucide-react';
import { socialMediaService } from '@/services/socialMediaService';
import { useToast } from '@/hooks/use-toast';
import { ImagePromptModal } from './ImagePromptModal';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostsTableProps {
  posts: SocialMediaPost[];
  onPostsChange: () => void;
}

export const PostsTable = ({ posts, onPostsChange }: PostsTableProps) => {
  const { toast } = useToast();
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
            {posts.map((post) => (
              <TableRow key={post.id}>
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
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleGenerateImagePrompt(post)}
                    title="Click to generate image prompt"
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
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
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