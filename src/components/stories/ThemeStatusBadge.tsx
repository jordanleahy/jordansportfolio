import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ThemeStatusBadgeProps {
  promptGenerationStatus?: 'not_started' | 'in_progress' | 'completed';
  lifecycleStatus?: 'pending' | 'generating' | 'ready' | 'completed';
  userInteractionRequired?: boolean;
  backgroundProcessingComplete?: boolean;
  className?: string;
}

export const ThemeStatusBadge = ({ 
  promptGenerationStatus, 
  lifecycleStatus,
  userInteractionRequired,
  backgroundProcessingComplete,
  className 
}: ThemeStatusBadgeProps) => {
  // Determine the overall status to display
  const getStatusInfo = () => {
    if (backgroundProcessingComplete && promptGenerationStatus === 'completed') {
      return {
        label: 'Ready',
        variant: 'default' as const,
        className: 'bg-green-500/20 text-green-700 border-green-500/20',
        icon: CheckCircle
      };
    }
    
    if (promptGenerationStatus === 'in_progress' || lifecycleStatus === 'generating') {
      return {
        label: 'Generating',
        variant: 'secondary' as const,
        className: 'bg-blue-500/20 text-blue-700 border-blue-500/20',
        icon: Loader2
      };
    }
    
    if (promptGenerationStatus === 'not_started' || lifecycleStatus === 'pending') {
      return {
        label: 'Pending',
        variant: 'outline' as const,
        className: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/20',
        icon: Clock
      };
    }
    
    // Default case for unknown status
    return {
      label: 'Processing',
      variant: 'secondary' as const,
      className: 'bg-gray-500/20 text-gray-700 border-gray-500/20',
      icon: Clock
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <Badge 
      className={`text-xs ${statusInfo.className} ${className}`}
      title={`Theme status: ${statusInfo.label}`}
    >
      <Icon 
        className={`h-3 w-3 mr-1 ${statusInfo.icon === Loader2 ? 'animate-spin' : ''}`} 
      />
      {statusInfo.label}
    </Badge>
  );
};