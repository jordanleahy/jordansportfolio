import React from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio?: string;
}

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ src, alt, priority = false, aspectRatio, className, style, ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={cn("object-cover", className)}
        style={{
          aspectRatio: aspectRatio || "auto",
          ...style,
        }}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";