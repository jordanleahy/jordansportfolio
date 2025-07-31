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
        <div className="w-full h-16 rounded border-2 border-dashed border-primary/30 bg-primary/5 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-primary/20 animate-bounce" />
          </div>
        </div>
        <div className="absolute top-1 left-1 text-xs text-primary/60 font-medium">
          Generating...
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full rounded-md border-2 border-dashed border-primary/30 bg-primary/5 animate-pulse ${className}`}
      style={{ aspectRatio }}
    >
      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full bg-primary/20 animate-bounce" />
      </div>
      <div className="absolute bottom-2 left-2 text-sm text-primary/70 font-medium">
        Generating Image...
      </div>
    </div>
  );
};