import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ImageModel } from '@/hooks/useMultiProviderImageGeneration';

interface ImageModelSelectorProps {
  value: ImageModel;
  onChange: (value: ImageModel) => void;
  disabled?: boolean;
  className?: string;
}

export const ImageModelSelector: React.FC<ImageModelSelectorProps> = ({ 
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
          if (newValue) onChange(newValue as ImageModel);
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