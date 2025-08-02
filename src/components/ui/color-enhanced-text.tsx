import React from 'react';

interface ColorEnhancedTextProps {
  text: string;
  className?: string;
}

export function ColorEnhancedText({ text, className = '' }: ColorEnhancedTextProps) {
  // Regex to match hex color codes (3, 4, 6, or 8 characters)
  const hexColorRegex = /#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})\b/g;
  
  const renderTextWithColorSwatches = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = hexColorRegex.exec(text)) !== null) {
      // Add text before the hex code
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Add the hex code with color swatch
      const hexCode = match[0];
      parts.push(
        <span key={`${match.index}-${hexCode}`} className="inline-flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded border border-border/50 flex-shrink-0"
            style={{ backgroundColor: hexCode }}
            title={`Color: ${hexCode}`}
          />
          <span className="font-mono text-sm">{hexCode}</span>
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts;
  };

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {renderTextWithColorSwatches(text)}
    </div>
  );
}