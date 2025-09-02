/**
 * PROMPT INPUT COMPONENT - Enhanced Textarea for Street Transformation Descriptions
 * 
 * PURPOSE:
 * This component provides a specialized text input interface for users to describe their
 * street transformation visions. It includes UX enhancements like keyboard shortcuts,
 * helpful placeholder text, and validation to improve the user experience for the
 * Street Vision feature.
 * 
 * KEY FEATURES:
 * - Enhanced textarea with street-specific placeholder text and guidance
 * - Keyboard shortcuts: Enter to submit, Shift+Enter for new lines
 * - Forward ref support for parent component control and focus management
 * - Consistent styling with design system tokens and proper contrast
 * - Disabled state handling during processing
 * 
 * UX ENHANCEMENTS:
 * - Descriptive label and helper text to guide user input
 * - Contextual placeholder with street transformation examples
 * - Visual feedback for keyboard shortcuts in helper text
 * - Proper sizing (120px minimum height) for comfortable typing
 * - Focus states with accent color highlighting
 * 
 * INTEGRATION:
 * - Receives value and onChange from parent for controlled input
 * - Optional onEnterPress callback for submission without form wrapping
 * - Supports all standard textarea props via prop spreading
 * - Integrates with form validation and submission workflows
 * 
 * ACCESSIBILITY:
 * - Proper labeling for screen readers
 * - Clear keyboard shortcut instructions
 * - Focus management and visual indicators
 * - Disabled state properly communicated
 */

import React, { forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * Component props interface for the enhanced prompt input
 */
interface PromptInputProps {
  value: string;                        // Current input value (controlled)
  onChange: (value: string) => void;    // Value change handler
  onEnterPress?: () => void;           // Optional Enter key submission handler
  className?: string;                   // Additional CSS classes
  placeholder?: string;                 // Custom placeholder text (has default)
  disabled?: boolean;                   // Disabled state during processing
}

/**
 * Enhanced prompt input component with keyboard shortcuts and validation
 * Designed specifically for street transformation descriptions
 */
export const PromptInput = forwardRef<HTMLTextAreaElement, PromptInputProps>(
  ({ value, onChange, onEnterPress, className, placeholder, disabled, ...props }, ref) => {
    /**
     * Handles text changes and propagates to parent component
     */
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    /**
     * Handles keyboard shortcuts for improved UX
     * Enter: Submit (if callback provided)
     * Shift+Enter: New line (default behavior)
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && onEnterPress) {
        e.preventDefault(); // Prevent default new line
        onEnterPress();     // Trigger submission
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