import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SocialMediaPost } from '@/types/socialMedia';
import { usePostEditor } from '@/hooks/usePostEditor';

interface PostEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost | null;
  onSuccess?: () => void;
}

export const PostEditModal = ({ isOpen, onClose, post, onSuccess }: PostEditModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [regeneratePrompt, setRegeneratePrompt] = useState(false);
  const { editPost, isEditing } = usePostEditor();

  // Reset form when post changes or modal opens
  useEffect(() => {
    if (post && isOpen) {
      setTitle(post.title);
      setDescription(post.description || '');
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
        regeneratePrompt
      });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    if (!isEditing) {
      onClose();
    }
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex items-center space-x-2">
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