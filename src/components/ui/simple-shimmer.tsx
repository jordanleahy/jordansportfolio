import { cn } from "@/lib/utils";

interface SimpleShimmerProps {
  aspectRatio?: string;
  className?: string;
  variant?: 'full' | 'thumbnail';
}

export const SimpleShimmer = ({ 
  aspectRatio = "16/9", 
  className = "",
  variant = 'full' 
}: SimpleShimmerProps) => {
  if (variant === 'thumbnail') {
    return (
      <div 
        className={cn(
          "w-full h-16 relative overflow-hidden",
          "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
          "before:bg-gradient-to-r before:from-transparent before:via-foreground/30 before:to-transparent",
          className
        )}
      />
    );
  }

  return (
    <div 
      className={cn(
        "w-full relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/30 before:to-transparent",
        className
      )}
      style={{ aspectRatio }}
    />
  );
};