import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { Lightbox } from '@/components/ui/lightbox';
import { cn } from '@/lib/utils';

interface Image {
  src: string;
  alt: string;
  caption?: string;
  title?: string;
}

interface StackedCarouselProps {
  images: Image[];
  aspectRatio?: string;
  className?: string;
}

export const StackedCarousel = ({
  images,
  aspectRatio = '16/9',
  className
}: StackedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  // Touch gestures
  const { ref: swipeRef } = useSwipeGestures({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    threshold: 50,
    velocityThreshold: 0.3,
  });

  if (images.length === 0) return null;

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const absIndex = Math.abs(diff);
    
    if (absIndex > 2) return { display: 'none' };

    // Desktop stacked effect
    const desktopTransform = {
      x: diff * 40,
      scale: 1 - absIndex * 0.05,
      opacity: 1 - absIndex * 0.3,
      rotateY: diff * 5,
      z: -absIndex * 50,
    };

    // Mobile simple effect
    const mobileTransform = {
      x: diff * 100 + '%',
      scale: 1,
      opacity: diff === 0 ? 1 : 0,
    };

    return {
      desktop: desktopTransform,
      mobile: mobileTransform,
      zIndex: images.length - absIndex,
    };
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Carousel Container */}
      <div 
        ref={swipeRef}
        className="relative w-full overflow-visible"
        style={{ aspectRatio }}
      >
        {/* Desktop: Perspective container */}
        <div className="hidden md:block relative w-full h-full" style={{ perspective: '1200px' }}>
          {images.map((image, index) => {
            const style = getCardStyle(index);
            if (style.display === 'none') return null;

            return (
              <motion.div
                key={image.src}
                animate={{
                  x: style.desktop.x,
                  scale: style.desktop.scale,
                  opacity: style.desktop.opacity,
                  rotateY: style.desktop.rotateY,
                  z: style.desktop.z,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="absolute inset-0 cursor-pointer"
                style={{
                  zIndex: style.zIndex,
                  transformStyle: 'preserve-3d',
                }}
                onClick={index === currentIndex ? handleImageClick : () => goToSlide(index)}
              >
                <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl bg-card">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: Stacked carousel with simpler transforms */}
        <div className="md:hidden relative w-full h-full">
          {images.map((image, index) => {
            const diff = index - currentIndex;
            const absIndex = Math.abs(diff);
            
            if (absIndex > 2) return null;

            return (
              <motion.div
                key={image.src}
                animate={{
                  x: diff * 30,
                  scale: 1 - absIndex * 0.1,
                  opacity: diff === 0 ? 1 : 0.4,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="absolute inset-0 cursor-pointer"
                style={{
                  zIndex: images.length - absIndex,
                }}
                onClick={index === currentIndex ? handleImageClick : () => goToSlide(index)}
              >
                <div className="w-full h-full rounded-lg overflow-hidden shadow-lg bg-card">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevious}
          disabled={images.length <= 1}
          className="h-10 w-10"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          {/* Slide Counter */}
          <span className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {images.length}
          </span>

          {/* Dot Indicators */}
          <div className="hidden sm:flex items-center gap-1.5 ml-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          disabled={images.length <= 1}
          className="h-10 w-10"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={images}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        initialIndex={currentIndex}
      />
    </div>
  );
};
