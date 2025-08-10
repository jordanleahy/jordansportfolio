import * as React from "react";
import { cn } from "@/lib/utils";
import { useTypewriterEffect } from "@/hooks/useTypewriterEffect";

interface TypewriterInputProps extends Omit<React.ComponentProps<"input">, "placeholder"> {
  typewriterTexts?: string[];
  baseText?: string;
  suffixes?: string[];
  fallbackPlaceholder?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

const TypewriterInput = React.forwardRef<HTMLInputElement, TypewriterInputProps>(
  ({ 
    className, 
    type, 
    typewriterTexts,
    baseText,
    suffixes,
    fallbackPlaceholder = "Type here...",
    typingSpeed = 80,
    deletingSpeed = 40,
    pauseDuration = 2000,
    value,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(Boolean(value));
    
    const { displayText, reset } = useTypewriterEffect({
      texts: typewriterTexts || [],
      baseText,
      suffixes,
      typingSpeed,
      deletingSpeed,
      pauseDuration,
      loop: true
    });

    React.useEffect(() => {
      setHasValue(Boolean(value));
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const hasTypewriterContent = (typewriterTexts && typewriterTexts.length > 0) || (baseText && suffixes && suffixes.length > 0);
    const showTypewriter = !isFocused && !hasValue && hasTypewriterContent;
    const placeholder = showTypewriter ? displayText : fallbackPlaceholder;

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          placeholder={placeholder}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          {...props}
        />
        {showTypewriter && (
          <span 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none animate-pulse"
            aria-hidden="true"
          >
            |
          </span>
        )}
      </div>
    );
  }
);

TypewriterInput.displayName = "TypewriterInput";

export { TypewriterInput };