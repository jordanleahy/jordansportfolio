import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ImageProvider } from '@/hooks/useMultiProviderImageGeneration';

interface ProviderSelectorProps {
  value: ImageProvider;
  onChange: (value: ImageProvider) => void;
  disabled?: boolean;
  className?: string;
}

const providerInfo: Record<ImageProvider, {
  name: string;
  description: string;
  badge: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  openai: {
    name: 'OpenAI GPT-Image-1',
    description: 'High-quality image generation with seed control',
    badge: 'Premium',
    badgeVariant: 'default'
  },
  gemini: {
    name: 'Google Gemini 2.5 Flash',
    description: 'Fast, conversational image generation and editing',
    badge: 'New',
    badgeVariant: 'secondary'
  }
};

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-foreground">
        AI Provider
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI provider" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(providerInfo).map(([key, info]) => (
            <SelectItem key={key} value={key} className="cursor-pointer">
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{info.name}</span>
                    <Badge variant={info.badgeVariant} className="text-xs">
                      {info.badge}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{info.description}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};