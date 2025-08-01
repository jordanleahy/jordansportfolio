import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MobileBatchSkeletonProps {
  isGenerating: boolean;
  className?: string;
}

export const MobileBatchSkeleton: React.FC<MobileBatchSkeletonProps> = ({
  isGenerating,
  className
}) => {
  if (!isGenerating) return null;

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-2 gap-2">
        {/* 16:9 Rectangle */}
        <div className="aspect-video">
          <Skeleton className="w-full h-full rounded-md" />
        </div>
        
        {/* 9:16 Rectangle */}
        <div className="aspect-[9/16]">
          <Skeleton className="w-full h-full rounded-md" />
        </div>
        
        {/* 4:3 Rectangle */}
        <div className="aspect-[4/3]">
          <Skeleton className="w-full h-full rounded-md" />
        </div>
        
        {/* 3:4 Rectangle */}
        <div className="aspect-[3/4]">
          <Skeleton className="w-full h-full rounded-md" />
        </div>
      </div>
    </div>
  );
};