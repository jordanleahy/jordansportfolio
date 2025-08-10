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
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (texts.length === 0) return;

    const currentText = texts[currentIndex];

    const type = () => {
      if (isDeleting) {
        setDisplayText(prev => {
          const newText = prev.slice(0, -1);
          // When we've deleted everything, move to next text
          if (newText.length === 0) {
            setIsDeleting(false);
            setIsPaused(true);
            timeoutRef.current = setTimeout(() => {
              setIsPaused(false);
              setCurrentIndex(prev => loop ? (prev + 1) % texts.length : Math.min(prev + 1, texts.length - 1));
            }, deletePauseDuration);
          }
          return newText;
        });
      } else {
        setDisplayText(prev => {
          const newText = currentText.slice(0, prev.length + 1);
          // When we've typed the full text, start deleting
          if (newText.length === currentText.length) {
            if (loop || currentIndex < texts.length - 1) {
              setIsPaused(true);
              timeoutRef.current = setTimeout(() => {
                setIsPaused(false);
                setIsDeleting(true);
              }, pauseDuration);
            }
          }
          return newText;
        });
      }
    };

    if (!isPaused && !timeoutRef.current) {
      const speed = isDeleting ? deletingSpeed : typingSpeed;
      timeoutRef.current = setTimeout(type, speed);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };
  }, [displayText, currentIndex, isDeleting, isPaused, texts, typingSpeed, deletingSpeed, pauseDuration, deletePauseDuration, loop]);

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayText('');
    setCurrentIndex(0);
    setIsDeleting(false);
    setIsPaused(false);
  };

  return { displayText, reset };
}