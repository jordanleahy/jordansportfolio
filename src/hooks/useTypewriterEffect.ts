import { useState, useEffect, useRef } from 'react';

interface UseTypewriterEffectOptions {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  deletePauseDuration?: number;
  loop?: boolean;
}

export function useTypewriterEffect({
  texts,
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

  useEffect(() => {
    if (texts.length === 0) return;

    const animate = () => {
      const currentText = texts[currentIndex];
      
      if (isDeleting) {
        // Delete one character
        setDisplayText(prev => {
          const newText = prev.slice(0, -1);
          
          if (newText.length === 0) {
            // Finished deleting, move to next text
            const nextIndex = loop ? (currentIndex + 1) % texts.length : Math.min(currentIndex + 1, texts.length - 1);
            console.log('🔄 Moving from text', currentIndex, 'to', nextIndex, '- from:', texts[currentIndex], 'to:', texts[nextIndex]);
            
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
          const newText = currentText.slice(0, prev.length + 1);
          
          if (newText.length === currentText.length) {
            // Finished typing, start deleting after pause
            if (loop || currentIndex < texts.length - 1) {
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
    
    // Start the animation cycle
    timeoutRef.current = setTimeout(animate, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, isDeleting, texts, typingSpeed, deletingSpeed, pauseDuration, deletePauseDuration, loop]);

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