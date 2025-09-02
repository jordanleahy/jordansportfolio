import React, { forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const PromptInput = forwardRef<HTMLTextAreaElement, PromptInputProps>(
  ({ value, onChange, className, placeholder, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
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
        </p>
      </div>
    );
  }
);

PromptInput.displayName = 'PromptInput';