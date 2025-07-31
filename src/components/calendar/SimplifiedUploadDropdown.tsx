import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import { useOptimizedBatchGeneration } from '@/hooks/useOptimizedBatchGeneration';
import { BatchProcessingSkeleton } from './BatchProcessingSkeleton';
import { BulkGenerationThumbnails } from './BulkGenerationThumbnails';
import type { AspectRatioKey, BulkImageGenerationRequest } from '@/types/bulkImageGeneration';

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
  const [showThumbnails, setShowThumbnails] = useState(false);

  const handleGenerateAllImages = async () => {
    if (!showThumbnails) {
      // First click: show thumbnails to confirm intent
      setShowThumbnails(true);
      return;
    }

    // Second click: start actual generation
    setShowThumbnails(false);
    if (!post) return;
    
    console.log('🚀 Starting optimized batch image generation for post:', post.id);
    
    try {
      const request: BulkImageGenerationRequest = {
        postId: post.id,
        title: post.title,
        description: post.description,
        category: post.category,
        context: 'table'
      };

      const response = await generateAllImages(request);

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
      
      {/* Thumbnail Preview - shown on first click */}
      <BulkGenerationThumbnails 
        showThumbnails={showThumbnails && !isGenerating(post.id)}
        className="mt-4"
      />
      
      {/* Batch Processing Skeleton - shown during generation */}
      <BatchProcessingSkeleton
        isGenerating={isGenerating(post.id)}
        progress={progress}
        className="mt-4"
      />
    </>
  );
};