import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';

interface SubscriptionBadgeProps {
  className?: string;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ 
  className = ""
}) => {
  const { data: subscriptionTier, isLoading } = useSubscriptionTier();

  if (isLoading) {
    return (
      <Badge variant="secondary" className={className}>
        Loading...
      </Badge>
    );
  }

  const tier = subscriptionTier || 'free';
  const displayTier = tier.charAt(0).toUpperCase() + tier.slice(1);

  const getVariant = () => {
    switch (tier.toLowerCase()) {
      case 'starter':
        return 'default';
      case 'pro':
        return 'secondary';
      case 'enterprise':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={className}
      title={`Current subscription: ${displayTier}`}
    >
      {displayTier}
    </Badge>
  );
};