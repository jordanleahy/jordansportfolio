import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  className?: string;
  onLoadComplete?: () => void;
  rootMargin?: string; // For intersection observer
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallbackSrc,
  placeholder,
  className,
  onLoadComplete,
  rootMargin = '50px',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, [rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && !hasError) {
      // Will trigger a re-render with fallback src
      return;
    }
  };

  const imageSrc = hasError && fallbackSrc ? fallbackSrc : src;
  const shouldShowImage = isInView || isLoaded;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          {placeholder || (
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={shouldShowImage ? imageSrc : undefined}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
    </div>
  );
};