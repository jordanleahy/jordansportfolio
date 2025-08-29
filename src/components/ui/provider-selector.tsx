import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles } from 'lucide-react';
import { ImageProvider } from '@/hooks/useMultiProviderImageGeneration';

interface ProviderSelectorProps {
  value: ImageProvider;
  onChange: (value: ImageProvider) => void;
  disabled?: boolean;
  className?: string;
}

const providerInfo: Record<ImageProvider, {
  displayName: string;
  description: string;
  badge: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
}> = {
  openai: {
    displayName: 'ChatGPT',
    description: 'High-quality image generation with seed control',
    badge: 'Premium',
    badgeVariant: 'default',
    icon: Bot
  },
  gemini: {
    displayName: 'Google',
    description: 'Fast, conversational image generation and editing',
    badge: 'New',
    badgeVariant: 'secondary',
    icon: Sparkles
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
      <ToggleGroup 
        type="single" 
        value={value} 
        onValueChange={(newValue) => {
          if (newValue && newValue !== value) {
            onChange(newValue as ImageProvider);
          }
        }}
        disabled={disabled}
        className="grid grid-cols-2 gap-2 w-full"
      >
        {Object.entries(providerInfo).map(([key, info]) => {
          const IconComponent = info.icon;
          return (
            <ToggleGroupItem
              key={key}
              value={key}
              className="flex flex-col items-center gap-2 p-4 h-auto data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            >
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className="font-medium">{info.displayName}</span>
                <Badge variant={info.badgeVariant} className="text-xs">
                  {info.badge}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground text-center">
                {info.description}
              </span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
};