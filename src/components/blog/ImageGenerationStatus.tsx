import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface ImageGenerationStatusProps {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  className?: string;
}

export const ImageGenerationStatus = ({ status, className = "" }: ImageGenerationStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Images Pending',
          variant: 'secondary' as const,
          color: 'text-muted-foreground'
        };
      case 'generating':
        return {
          icon: Loader2,
          text: 'Generating Images...',
          variant: 'secondary' as const,
          color: 'text-primary',
          animate: true
        };
      case 'completed':
        return {
          icon: CheckCircle,
          text: 'Images Generated',
          variant: 'default' as const,
          color: 'text-primary'
        };
      case 'failed':
        return {
          icon: XCircle,
          text: 'Generation Failed',
          variant: 'destructive' as const,
          color: 'text-destructive'
        };
      default:
        return {
          icon: Clock,
          text: 'Unknown Status',
          variant: 'secondary' as const,
          color: 'text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-2 ${className}`}>
      <Icon 
        className={`h-3 w-3 ${config.color} ${config.animate ? 'animate-spin' : ''}`} 
      />
      <span className={config.color}>{config.text}</span>
    </Badge>
  );
};