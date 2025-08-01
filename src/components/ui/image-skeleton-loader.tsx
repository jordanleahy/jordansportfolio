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
  const shimmerClasses = cn(
    "relative overflow-hidden",
    "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
    "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
    className
  );

  if (variant === 'thumbnail') {
    return (
      <div className={cn("w-full h-16", shimmerClasses)} />
    );
  }

  return (
    <div 
      className={cn("w-full", shimmerClasses)}
      style={{ aspectRatio }}
    />
  );
};