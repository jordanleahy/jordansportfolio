import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
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

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
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
    
    // Only show current and future cards (hide previous cards)
    if (diff < 0 || diff > 2) return { display: 'none' };

    // Horizontal stacking with height reduction - Framer style
    const desktopTransform = {
      x: diff * 60, // Horizontal offset only
      y: 0, // No vertical offset
      scaleY: 1 - diff * 0.15, // Reduce height progressively
      scaleX: 1 - diff * 0.05, // Slight width reduction
      opacity: 1 - diff * 0.2,
    };

    // Mobile stacked effect - smaller offsets
    const mobileTransform = {
      x: diff * 40,
      y: 0,
      scaleY: 1 - diff * 0.15,
      scaleX: 1 - diff * 0.08,
      opacity: 1 - diff * 0.25,
    };

    return {
      desktop: desktopTransform,
      mobile: mobileTransform,
      zIndex: images.length - diff,
    };
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Carousel Container */}
      <div 
        ref={swipeRef}
        className="relative w-full overflow-visible origin-top-left"
        style={{ 
          aspectRatio,
          transform: 'scale(0.75)',
        }}
      >
        {/* Desktop: Horizontally stacked cards */}
        <div className="hidden md:block relative w-full h-full">
          {images.map((image, index) => {
            const style = getCardStyle(index);
            if (style.display === 'none') return null;

            return (
              <motion.div
                key={image.src}
                animate={{
                  x: style.desktop.x,
                  y: style.desktop.y,
                  scaleX: style.desktop.scaleX,
                  scaleY: style.desktop.scaleY,
                  opacity: style.desktop.opacity,
                }}
                transition={{
                  duration: 0.4,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="absolute inset-0 cursor-pointer origin-left"
                style={{
                  zIndex: style.zIndex,
                }}
                onClick={() => goToSlide(index)}
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

        {/* Mobile: Horizontally stacked cards */}
        <div className="md:hidden relative w-full h-full">
          {images.map((image, index) => {
            const style = getCardStyle(index);
            if (style.display === 'none') return null;

            return (
              <motion.div
                key={image.src}
                animate={{
                  x: style.mobile.x,
                  y: style.mobile.y,
                  scaleX: style.mobile.scaleX,
                  scaleY: style.mobile.scaleY,
                  opacity: style.mobile.opacity,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="absolute inset-0 cursor-pointer origin-left"
                style={{
                  zIndex: style.zIndex,
                }}
                onClick={() => goToSlide(index)}
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

    </div>
  );
};
