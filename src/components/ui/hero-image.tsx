import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
  priority?: boolean;
}

export const HeroImage = ({ 
  src, 
  alt, 
  className = '', 
  children,
  priority = false 
}: HeroImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Preload the image
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    img.src = src;

    // Preload in document head for priority images
    if (priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, priority]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Gradient Background - Always visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" />
      
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      
      {/* Main Image */}
      {isLoaded && !hasError && (
        <motion.img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1]
          }}
          loading={priority ? "eager" : "lazy"}
        />
      )}
      
      {/* Error Fallback - Enhanced gradient */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/15" />
      )}
      
      {/* Content Overlay */}
      {children && (
        <motion.div 
          className="relative z-10 h-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8,
            delay: isLoaded ? 0.3 : 0,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};