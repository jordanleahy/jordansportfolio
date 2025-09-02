import React, { forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnterPress?: () => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const PromptInput = forwardRef<HTMLTextAreaElement, PromptInputProps>(
  ({ value, onChange, onEnterPress, className, placeholder, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && onEnterPress) {
        e.preventDefault();
        onEnterPress();
      }
    };

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Describe your vision
        </label>
        <Textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Describe how you want to transform this street. For example: 'Add protected bike lanes, expand sidewalks for outdoor dining, and include more trees and greenery for a pedestrian-friendly environment.'"}
          disabled={disabled}
          className={cn(
            "min-h-[120px] resize-none bg-background border-border",
            "placeholder:text-muted-foreground",
            "focus:ring-2 focus:ring-accent focus:border-transparent",
            className
          )}
          {...props}
        />
        <p className="text-xs text-muted-foreground">
          Be specific about bike lanes, sidewalk improvements, greenery, and pedestrian safety features you'd like to see.
          <span className="text-accent ml-2">Press Enter to run, Shift+Enter for new line</span>
        </p>
      </div>
    );
  }
);

PromptInput.displayName = 'PromptInput';