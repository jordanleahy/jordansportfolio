import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ImageSkeletonLoader } from '@/components/ui/image-skeleton-loader';
import { ASPECT_RATIO_CONFIGS } from '@/types/bulkImageGeneration';

interface BulkGenerationThumbnailsProps {
  showThumbnails: boolean;
  className?: string;
}

export const BulkGenerationThumbnails: React.FC<BulkGenerationThumbnailsProps> = ({
  showThumbnails,
  className = ''
}) => {
  if (!showThumbnails) return null;

  return (
    <Card className={`w-full border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-4">
        <div className="mb-3">
          <span className="text-sm font-medium text-primary">
            Preparing to generate all images...
          </span>
        </div>
        
        {/* Thumbnail grid showing what will be generated */}
        <div className="grid grid-cols-2 gap-3">
          {ASPECT_RATIO_CONFIGS.map(({ ratio, label }) => (
            <div key={ratio} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
              
              <ImageSkeletonLoader
                aspectRatio={ratio.replace(':', '/')}
                variant="thumbnail"
                className="animate-pulse"
              />
            </div>
          ))}
        </div>

        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            Click again to start generation
          </p>
        </div>
      </CardContent>
    </Card>
  );
};