import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import type { SocialMediaPost } from '@/types/socialMedia';
import { useBulkImageGeneration } from '@/hooks/useImageBatchGeneration';
import { useProcessingStates } from '@/hooks/useProcessingStates';
import type { AspectRatioKey, BulkImageGenerationRequest } from '@/types/bulkImageGeneration';

interface BulkImageGenerationButtonProps {
  post: SocialMediaPost;
  isUploading: (postId: string, aspectRatio?: AspectRatioKey) => boolean;
  getUploadType: (postId: string) => AspectRatioKey | null;
  onFileSelect: (postId: string, aspectRatio: AspectRatioKey) => void;
  onPostsChange?: (posts: SocialMediaPost[]) => void;
}

export const BulkImageGenerationButton: React.FC<BulkImageGenerationButtonProps> = ({
  post,
  isUploading,
  getUploadType,
  onFileSelect,
  onPostsChange,
}) => {
  const { generateAllImages, progress } = useBulkImageGeneration();
  const { isGenerating } = useProcessingStates();

  const handleGenerateAllImages = async () => {
    if (!post) return;
    
    console.log(`🚀 [BulkGeneration] Starting bulk generation for post: ${post.id}`);
    
    try {
      const request: BulkImageGenerationRequest = {
        postId: post.id,
        title: post.title,
        description: post.description,
        category: post.category,
        context: 'table',
        colorThemeId: post.color_theme_id || undefined
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
      
      {/* Skeleton Grid - shown during generation */}
      {isGenerating(post.id) && (
        <div className="mt-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 w-full">
              <Skeleton className="w-full h-full object-cover rounded border" />
            </div>
            <div className="h-16 w-full">
              <Skeleton className="w-full h-full object-cover rounded border" />
            </div>
            <div className="h-16 w-full">
              <Skeleton className="w-full h-full object-cover rounded border" />
            </div>
            <div className="h-16 w-full">
              <Skeleton className="w-full h-full object-cover rounded border" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};