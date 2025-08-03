import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { IMAGE_STATUS } from '@/constants/agentConstants';

interface ImageGenerationStatusProps {
  status: string; // Using string to match database values
  className?: string;
}

export const ImageGenerationStatus = ({ status, className = "" }: ImageGenerationStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case IMAGE_STATUS.PENDING:
        return {
          icon: Clock,
          text: 'Images Pending',
          variant: 'secondary' as const,
          color: 'text-muted-foreground'
        };
      case IMAGE_STATUS.GENERATING:
        return {
          icon: Loader2,
          text: 'Generating Images...',
          variant: 'secondary' as const,
          color: 'text-primary',
          animate: true
        };
      case IMAGE_STATUS.COMPLETED:
        return {
          icon: CheckCircle,
          text: 'Images Generated',
          variant: 'default' as const,
          color: 'text-primary'
        };
      case IMAGE_STATUS.FAILED:
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