import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ImageSkeletonLoaderProps {
  aspectRatio?: string;
  className?: string;
  variant?: 'full' | 'thumbnail';
}

export const ImageSkeletonLoader = ({ 
  aspectRatio = "16/9", 
  className = "",
  variant = 'full' 
}: ImageSkeletonLoaderProps) => {
  if (variant === 'thumbnail') {
    return (
      <Skeleton 
        className={cn("w-full h-16 rounded", className)}
      />
    );
  }

  return (
    <Skeleton 
      className={cn("w-full rounded-md", className)}
      style={{ aspectRatio }}
    />
  );
};