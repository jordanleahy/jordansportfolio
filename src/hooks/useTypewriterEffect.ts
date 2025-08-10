import { useState, useEffect, useRef } from 'react';

interface UseTypewriterEffectOptions {
  texts: string[];
  baseText?: string;
  suffixes?: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  deletePauseDuration?: number;
  loop?: boolean;
}

export function useTypewriterEffect({
  texts,
  baseText,
  suffixes,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
  deletePauseDuration = 500,
  loop = true
}: UseTypewriterEffectOptions) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Use suffixes mode if baseText and suffixes are provided, otherwise use legacy texts mode
  const isBaseTextMode = Boolean(baseText && suffixes && suffixes.length > 0);
  const workingTexts = isBaseTextMode ? suffixes : texts;
  const base = isBaseTextMode ? baseText : '';

  useEffect(() => {
    if (workingTexts.length === 0) return;

    const animate = () => {
      const currentSuffix = workingTexts[currentIndex];
      const fullTargetText = base + currentSuffix;
      
      if (isDeleting) {
        // Delete one character from the suffix only
        setDisplayText(prev => {
          // Only delete from the suffix part (after base text)
          const suffixPart = prev.slice(base.length);
          const newSuffixPart = suffixPart.slice(0, -1);
          const newText = base + newSuffixPart;
          
          if (newSuffixPart.length === 0) {
            // Finished deleting suffix, move to next text
            const nextIndex = loop ? (currentIndex + 1) % workingTexts.length : Math.min(currentIndex + 1, workingTexts.length - 1);
            
            timeoutRef.current = setTimeout(() => {
              setCurrentIndex(nextIndex);
              setIsDeleting(false);
            }, deletePauseDuration);
            
            return newText;
          }
          
          // Continue deleting
          timeoutRef.current = setTimeout(animate, deletingSpeed);
          return newText;
        });
      } else {
        // Type one character
        setDisplayText(prev => {
          const currentLength = prev.length;
          const newText = fullTargetText.slice(0, currentLength + 1);
          
          if (newText.length === fullTargetText.length) {
            // Finished typing, start deleting after pause (only if there are more texts or loop is enabled)
            if (loop || currentIndex < workingTexts.length - 1) {
              timeoutRef.current = setTimeout(() => {
                setIsDeleting(true);
                animate();
              }, pauseDuration);
            }
            return newText;
          }
          
          // Continue typing
          timeoutRef.current = setTimeout(animate, typingSpeed);
          return newText;
        });
      }
    };

    // Clear any existing timeout and start animation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Initialize with base text if in base text mode
    if (isBaseTextMode && displayText === '') {
      setDisplayText(base);
      timeoutRef.current = setTimeout(animate, 100);
    } else {
      timeoutRef.current = setTimeout(animate, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, isDeleting, workingTexts, base, isBaseTextMode, typingSpeed, deletingSpeed, pauseDuration, deletePauseDuration, loop]);

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayText('');
    setCurrentIndex(0);
    setIsDeleting(false);
  };

  return { displayText, reset };
}