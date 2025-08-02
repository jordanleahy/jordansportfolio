import React from 'react';

interface ColorEnhancedTextProps {
  text: string;
  className?: string;
}

export function ColorEnhancedText({ text, className = '' }: ColorEnhancedTextProps) {
  // Enhanced regex to match hex colors and their surrounding context
  const colorContextRegex = /(\w+)\s+(#[A-Fa-f0-9]{3,8})\b/g;
  
  const renderTextWithColors = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    let match;
    
    // Reset regex state
    colorContextRegex.lastIndex = 0;
    
    while ((match = colorContextRegex.exec(text)) !== null) {
      // Add text before the color reference
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      
      // Extract the word and hex code
      const word = match[1];
      const hexCode = match[2];
      
      // Apply the color to the word
      parts.push(
        <span key={`${match.index}-${hexCode}`} className="inline-flex items-center gap-1">
          <span 
            className="font-medium"
            style={{ color: hexCode }}
          >
            {word}
          </span>
          <div 
            className="w-2 h-2 rounded border border-border/50 flex-shrink-0"
            style={{ backgroundColor: hexCode }}
            title={`Color: ${hexCode}`}
          />
          <span className="font-mono text-xs opacity-70">{hexCode}</span>
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
      {renderTextWithColors(text)}
    </div>
  );
}