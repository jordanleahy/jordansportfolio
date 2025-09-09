import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Sparkles } from 'lucide-react';
import { SocialMediaPost } from '@/types/socialMedia';
import { usePostEditor } from '@/hooks/usePostEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PostEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost | null;
  onSuccess?: () => void;
}

export const PostEditModal = ({ isOpen, onClose, post, onSuccess }: PostEditModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [regeneratePrompt, setRegeneratePrompt] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const { editPost, isEditing } = usePostEditor();

  // Reset form when post changes or modal opens
  useEffect(() => {
    if (post && isOpen) {
      setTitle(post.title);
      setDescription(post.description || '');
      setShareTitle(post.share_title || '');
      setShareDescription(post.share_description || '');
      setRegeneratePrompt(false);
    }
  }, [post, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!post || !title.trim()) {
      return;
    }

    try {
      await editPost(post.id, {
        title,
        description,
        share_title: shareTitle || null,
        share_description: shareDescription || null,
        regeneratePrompt
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const generateShareContent = async () => {
    if (!post) return;
    
    try {
      setIsGeneratingShare(true);
      const { data, error } = await supabase.functions.invoke('generate-share-content', {
        body: {
          post_id: post.id,
          platform: 'linkedin',
          hook_type: 'parent_problem'
        }
      });

      if (error) throw error;

      if (data?.share_title && data?.share_description) {
        setShareTitle(data.share_title);
        setShareDescription(data.share_description);
        toast.success('Share content generated!');
      }
    } catch (error) {
      console.error('Error generating share content:', error);
      toast.error('Failed to generate share content');
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyLinkedInPost = async () => {
    if (!shareTitle || !shareDescription) return;
    
    const linkedInHashtags = post?.category === 'parenting' 
      ? '#ParentingTips #ToddlerCalm #PeppaPig #ParentLife #ChildDevelopment'
      : `#${post?.category?.replace(/\s+/g, '')} #ParentingTips #Education`;
    
    const fullShareText = `${shareTitle}\n\n${shareDescription}\n\nLink in comments 👇\n\n${linkedInHashtags}`;
    
    await copyToClipboard(fullShareText, 'LinkedIn post');
  };

  const handleClose = () => {
    if (!isEditing) {
      onClose();
    }
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                disabled={isEditing}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter post description"
                disabled={isEditing}
                rows={4}
              />
            </div>
          </div>

          {/* Share-Optimized Content */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <Label className="text-sm font-medium">Share-Optimized Content</Label>
                <Badge variant="secondary" className="text-xs">LinkedIn Ready</Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateShareContent}
                disabled={isGeneratingShare || isEditing}
                className="flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                {isGeneratingShare ? 'Generating...' : 'Generate'}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shareTitle">Share Title</Label>
                {shareTitle && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(shareTitle, 'Share title')}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Textarea
                id="shareTitle"
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                placeholder="Emotional hook headline (auto-generated)"
                disabled={isEditing}
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shareDescription">Share Description</Label>
                {shareDescription && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(shareDescription, 'Share description')}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Textarea
                id="shareDescription"
                value={shareDescription}
                onChange={(e) => setShareDescription(e.target.value)}
                placeholder="Benefit-driven description with CTA (auto-generated)"
                disabled={isEditing}
                rows={4}
                className="text-sm"
              />
            </div>

            {shareTitle && shareDescription && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyLinkedInPost}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy LinkedIn Post
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const linkedInHashtags = post?.category === 'parenting' 
                      ? '#ParentingTips #ToddlerCalm #PeppaPig #ParentLife #ChildDevelopment'
                      : `#${post?.category?.replace(/\s+/g, '')} #ParentingTips #Education`;
                    
                    const fullShareText = `${shareTitle}\n\n${shareDescription}\n\nLink in comments 👇\n\n${linkedInHashtags}`;
                    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(fullShareText)}`;
                    window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center gap-1"
                >
                  <Share2 className="h-3 w-3" />
                  Share on LinkedIn
                </Button>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2 border-t pt-4">
            <Checkbox
              id="regeneratePrompt"
              checked={regeneratePrompt}
              onCheckedChange={(checked) => setRegeneratePrompt(checked as boolean)}
              disabled={isEditing}
            />
            <Label htmlFor="regeneratePrompt" className="text-sm">
              Regenerate image prompt after saving
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isEditing || !title.trim()}
            >
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};