import React, { memo } from 'react';
import { LazyImage } from './lazy-image';
import { cn } from '@/lib/utils';

interface ImageVersion {
  id: string;
  url: string;
  version_number: number;
  prompt?: string;
}

interface ImageVersionThumbnailsProps {
  versions: ImageVersion[];
  currentIndex: number;
  onVersionSelect: (index: number) => void;
  className?: string;
}

export const ImageVersionThumbnails = memo(({
  versions,
  currentIndex,
  onVersionSelect,
  className
}: ImageVersionThumbnailsProps) => {
  if (versions.length <= 1) return null;

  return (
    <div className={cn("flex gap-1 overflow-x-auto py-2 px-1", className)}>
      {versions.map((version, index) => (
        <button
          key={version.id}
          onClick={() => onVersionSelect(index)}
          className={cn(
            "flex-shrink-0 w-11 h-11 rounded-md overflow-hidden border-2 transition-all duration-200",
            "hover:scale-105 hover:shadow-md",
            currentIndex === index
              ? "border-primary shadow-md ring-2 ring-primary/20"
              : "border-border hover:border-primary/50"
          )}
          title={version.prompt ? `Version ${version.version_number}: ${version.prompt}` : `Version ${version.version_number}`}
        >
          <LazyImage
            src={version.url}
            alt={`Version ${version.version_number}`}
            className="w-full h-full object-cover"
            placeholder={
              <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                <span className="text-xs text-muted-foreground">{version.version_number}</span>
              </div>
            }
          />
        </button>
      ))}
    </div>
  );
});

ImageVersionThumbnails.displayName = 'ImageVersionThumbnails';