import React, { useCallback, useEffect, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SlideContainerProps {
  children: React.ReactNode[];
  onSlideChange?: (index: number) => void;
}

export const SlideContainer: React.FC<SlideContainerProps> = ({ 
  children, 
  onSlideChange 
}) => {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    align: 'start',
    skipSnaps: false,
    axis: 'y',
    dragFree: false,
    containScroll: 'trimSnaps',
    slidesToScroll: 1,
    duration: 30,
    dragThreshold: 10,
    inViewThreshold: 0.7
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Desktop scroll handling
  const handleDesktopScroll = useCallback(() => {
    if (!scrollContainerRef.current || isMobile) return;
    
    const container = scrollContainerRef.current;
    const slideHeight = container.clientHeight;
    const currentIndex = Math.round(container.scrollTop / slideHeight);
    
    if (currentIndex !== selectedIndex) {
      setSelectedIndex(currentIndex);
      if (onSlideChange) {
        onSlideChange(currentIndex);
      }
    }
    
    setCanScrollPrev(container.scrollTop > 0);
    setCanScrollNext(container.scrollTop < container.scrollHeight - container.clientHeight);
  }, [selectedIndex, onSlideChange, isMobile]);

  // Desktop scroll to slide
  const scrollToDesktop = useCallback((index: number) => {
    if (!scrollContainerRef.current || isMobile) return;
    
    const container = scrollContainerRef.current;
    const slideHeight = container.clientHeight;
    container.scrollTo({
      top: index * slideHeight,
      behavior: 'smooth'
    });
  }, [isMobile]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (isMobile) {
      if (emblaApi) emblaApi.scrollTo(index);
    } else {
      scrollToDesktop(index);
    }
  }, [emblaApi, isMobile, scrollToDesktop]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    
    if (onSlideChange) {
      onSlideChange(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi, onSlideChange]);

  useEffect(() => {
    if (!emblaApi || !isMobile) return;

    onSelect();
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect, isMobile]);

  // Desktop scroll listener
  useEffect(() => {
    if (isMobile || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    container.addEventListener('scroll', handleDesktopScroll);
    
    // Initial call to set state
    handleDesktopScroll();
    
    return () => {
      container.removeEventListener('scroll', handleDesktopScroll);
    };
  }, [handleDesktopScroll, isMobile]);

  // Mobile view with Embla Carousel
  if (isMobile) {
    return (
      <div className="relative w-full h-dvh overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
        {/* Main Carousel */}
        <div className="embla h-full w-full" ref={emblaRef}>
          <div className="embla__container h-full flex flex-col" style={{ scrollSnapType: 'y mandatory' }}>
            {children.map((child, index) => (
              <div key={index} className="embla__slide flex-[0_0_100%] min-h-0 w-full h-full overflow-hidden" style={{ scrollSnapAlign: 'start' }}>
                {child}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation Controls */}
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-2 z-10">
          {/* Progress Dots */}
          <div className="flex flex-col space-y-2">
            {Array.from({ length: children.length }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === selectedIndex 
                    ? "bg-primary h-8" 
                    : "bg-foreground/20 hover:bg-foreground/40"
                )}
              />
            ))}
          </div>
        </div>

        {/* Slide Counter */}
        <div className="absolute top-6 right-6 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-foreground">
          {selectedIndex + 1} / {children.length}
        </div>
      </div>
    );
  }

  // Desktop view with native scrolling
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Main Scroll Container for Desktop */}
      <div 
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-auto scroll-smooth"
        style={{ 
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth'
        }}
      >
        {children.map((child, index) => (
          <div 
            key={index} 
            className="w-full h-screen flex-shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Desktop Navigation Controls */}
      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-2 z-10">
        {/* Progress Dots */}
        <div className="flex flex-col space-y-2">
          {Array.from({ length: children.length }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === selectedIndex 
                  ? "bg-primary h-8" 
                  : "bg-foreground/20 hover:bg-foreground/40"
              )}
            />
          ))}
        </div>
      </div>

      {/* Slide Counter */}
      <div className="absolute top-6 right-6 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-foreground">
        {selectedIndex + 1} / {children.length}
      </div>
    </div>
  );
};