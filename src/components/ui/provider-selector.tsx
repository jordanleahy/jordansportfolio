import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ImageProvider } from '@/hooks/useMultiProviderImageGeneration';

interface ProviderSelectorProps {
  value: ImageProvider;
  onChange: (value: ImageProvider) => void;
  disabled?: boolean;
  className?: string;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  className = '' 
}) => {
  return (
    <div className={className}>
      <ToggleGroup 
        type="single" 
        value={value} 
        onValueChange={(newValue) => {
          if (newValue) onChange(newValue as ImageProvider);
        }}
        disabled={disabled}
        className="justify-start"
      >
        <ToggleGroupItem value="openai" variant="outline">
          ChatGPT
        </ToggleGroupItem>
        <ToggleGroupItem value="gemini" variant="outline">
          Google
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};