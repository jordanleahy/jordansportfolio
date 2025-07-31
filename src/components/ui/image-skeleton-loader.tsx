import { Skeleton } from "@/components/ui/skeleton";

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
      <div className={`relative ${className}`}>
        <Skeleton className="w-full h-16 rounded border" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full rounded-md border overflow-hidden bg-muted/10 ${className}`}
      style={{ aspectRatio }}
    >
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full animate-pulse" />
      </div>
    </div>
  );
};