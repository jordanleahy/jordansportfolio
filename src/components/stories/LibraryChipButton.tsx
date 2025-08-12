import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import { BookOpen } from 'lucide-react';

interface LibraryChipButtonProps {
  post: SocialMediaPost;
}

export const LibraryChipButton: React.FC<LibraryChipButtonProps> = ({ post }) => {
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishSingle = async () => {
    try {
      setIsPublishing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Sign in required', description: 'Please sign in to publish to the Library', variant: 'destructive' });
        return;
      }

      // Build a handle based on user info
      const rawHandle = (session.user.user_metadata?.preferred_username
        || session.user.email?.split('@')[0]
        || session.user.id.slice(0, 8)) as string;
      const handle = rawHandle
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .slice(0, 32)
        .replace(/^-+|-+$/g, '') || session.user.id.slice(0, 8);

      const titleArg = (post.title || handle).slice(0, 80);
      const baseDesc = (post.description || '').replace(/\s+/g, ' ').trim();
      const descriptionArg = baseDesc.length > 0 ? baseDesc.slice(0, 165) : `A shareable image from ${titleArg}.`;

      const { error } = await supabase.rpc('publish_shared_collection_16_9', {
        p_handle: handle,
        p_post_ids: [post.id],
        p_theme_id: post.theme_id ?? null,
        p_title: titleArg,
        p_description: descriptionArg,
      });

      if (error) {
        console.error('Publish error', error);
        toast({ title: 'Failed to publish', description: error.message || 'Try again later', variant: 'destructive' });
        return;
      }

      toast({ title: 'Published to Library', description: 'Your post is now in your public Library.' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const disabled = isPublishing || !post.image_16_9_url; // requires 16:9 image per RPC

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full px-3 inline-flex items-center gap-1"
      onClick={handlePublishSingle}
      disabled={disabled}
      title={!post.image_16_9_url ? 'Add a 16:9 image to publish to Library' : 'Publish to Library'}
    >
      <BookOpen className="h-3 w-3" />
      Library
    </Button>
  );
};
