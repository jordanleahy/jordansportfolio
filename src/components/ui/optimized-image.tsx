import React, { useState } from "react";
import { cn } from "@/lib/utils";

export type ImageSize = 'thumbnail' | 'preview' | 'full';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio?: string;
  size?: ImageSize;
  quality?: number;
}

const getTransformationParams = (size: ImageSize, quality?: number): string => {
  const params = new URLSearchParams();
  
  switch (size) {
    case 'thumbnail':
      params.set('width', '100');
      params.set('height', '100');
      params.set('quality', String(quality || 60));
      break;
    case 'preview':
      params.set('width', '400');
      params.set('height', '400');
      params.set('quality', String(quality || 75));
      break;
    case 'full':
      if (quality && quality < 90) {
        params.set('quality', String(quality));
      }
      break;
  }
  
  // Add WebP format for better compression
  params.set('format', 'webp');
  
  return params.toString();
};

const getOptimizedUrl = (src: string, size: ImageSize = 'full', quality?: number): string => {
  // Only transform Supabase storage URLs
  if (!src.includes('supabase') && !src.includes('wgwmzfbnkovumqcvsxgd')) {
    return src;
  }
  
  const transformParams = getTransformationParams(size, quality);
  if (!transformParams) return src;
  
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}${transformParams}`;
};

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ src, alt, priority = false, aspectRatio, size = 'full', quality, className, style, ...props }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    
    const optimizedSrc = getOptimizedUrl(src, size, quality);
    const placeholderSrc = size !== 'thumbnail' ? getOptimizedUrl(src, 'thumbnail', 30) : undefined;
    
    const handleLoad = () => setIsLoading(false);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };
    
    return (
      <div className="relative overflow-hidden" style={{ aspectRatio: aspectRatio || "auto" }}>
        {/* Blur placeholder for larger images */}
        {placeholderSrc && isLoading && !hasError && (
          <img
            src={placeholderSrc}
            alt=""
            className={cn(
              "absolute inset-0 w-full h-full object-cover blur-sm scale-110 transition-opacity duration-300",
              className
            )}
            style={style}
          />
        )}
        
        {/* Main image */}
        <img
          ref={ref}
          src={hasError ? src : optimizedSrc} // Fallback to original on error
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          style={{
            width: "100%",
            height: "100%",
            ...style,
          }}
          {...props}
        />
        
        {/* Loading state */}
        {isLoading && !placeholderSrc && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";