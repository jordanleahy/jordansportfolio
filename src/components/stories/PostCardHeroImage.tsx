import React from 'react';
import { SimpleShimmer } from '@/components/ui/simple-shimmer';
import { ImageIcon } from 'lucide-react';
import type { SocialMediaPost } from '@/types/socialMedia';

interface PostCardHeroImageProps {
  post: SocialMediaPost;
  colorTheme?: { name: string };
  isProcessing?: boolean;
}

export const PostCardHeroImage: React.FC<PostCardHeroImageProps> = ({
  post,
  isProcessing
}) => {
  const isLoading = isProcessing || (post.image_1_1_status === 'processing');

  return (
    <div className="space-y-4">
      {/* Hero Image Display */}
      <div className="aspect-square rounded-t-lg overflow-hidden">
        {isLoading ? (
          <SimpleShimmer 
            variant="full"
            className="w-full h-full"
          />
        ) : post.image_1_1_url ? (
          <img
            src={post.image_1_1_url}
            alt="Hero image"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="bg-muted w-full h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No Image Available</p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold text-foreground leading-tight">
          {post.title || 'Untitled Post'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {post.description}
        </p>
      </div>
    </div>
  );
};