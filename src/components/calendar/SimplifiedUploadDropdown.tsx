import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import { useOptimizedBatchGeneration } from '@/hooks/useOptimizedBatchGeneration';
import { BatchProcessingSkeleton } from './BatchProcessingSkeleton';
import type { AspectRatioKey } from '@/types/batchImageGeneration';

interface SimplifiedUploadDropdownProps {
  post: SocialMediaPost;
  isUploading: (postId: string, aspectRatio?: AspectRatioKey) => boolean;
  getUploadType: (postId: string) => AspectRatioKey | null;
  onFileSelect: (postId: string, aspectRatio: AspectRatioKey) => void;
  onPostsChange?: (posts: SocialMediaPost[]) => void;
}

export const SimplifiedUploadDropdown: React.FC<SimplifiedUploadDropdownProps> = ({
  post,
  isUploading,
  getUploadType,
  onFileSelect,
  onPostsChange,
}) => {
  const { generateAllImages, isGenerating, progress } = useOptimizedBatchGeneration();

  const handleGenerateAllImages = async () => {
    if (!post) return;
    
    console.log('🚀 Starting optimized batch image generation for post:', post.id);
    
    try {
      const response = await generateAllImages({
        postId: post.id,
        title: post.title,
        description: post.description,
        category: post.category
      });

      // Refresh the post data to show the new images
      if (response.success && onPostsChange) {
        const { data: refreshedPosts } = await supabase
          .from('social_media_posts')
          .select('*')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .order('day', { ascending: true });
        
        if (refreshedPosts) {
          onPostsChange(refreshedPosts as SocialMediaPost[]);
        }
      }
      
    } catch (error) {
      console.error('❌ Optimized batch generation error:', error);
    }
  };


  return (
    <>
      <Button
        onClick={handleGenerateAllImages}
        disabled={isGenerating(post.id) || isUploading(post.id)}
        variant="outline"
        size="sm"
        className="h-8 flex-1"
        title="Generate All Images with AI"
      >
        {isGenerating(post.id) ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </Button>
      
      {/* Batch Processing Skeleton */}
      <BatchProcessingSkeleton
        isGenerating={isGenerating(post.id)}
        progress={progress}
        className="mt-4"
      />
    </>
  );
};