import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';

interface CreditStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const CreditStatus: React.FC<CreditStatusProps> = ({ 
  showDetails = false,
  className = ""
}) => {
  const { getCreditStatus } = useCreditCheck();
  const { data: subscriptionTier, isLoading: tierLoading } = useSubscriptionTier();
  const creditStatus = getCreditStatus();

  if (creditStatus.isLoading || tierLoading) {
    return (
      <Badge variant="secondary" className={className}>
        Loading...
      </Badge>
    );
  }

  const getVariant = () => {
    if (!creditStatus.hasCredits) return "destructive";
    if (creditStatus.remainingDaily <= 1 || creditStatus.remainingMonthly <= 5) return "outline";
    return "secondary";
  };

  const getDisplayText = () => {
    if (!creditStatus.hasCredits) {
      return creditStatus.blockingLimit === 'daily' ? 'Daily limit reached' : 'Monthly limit reached';
    }
    
    if (showDetails) {
      return `${creditStatus.remainingDaily} daily / ${creditStatus.remainingMonthly} monthly`;
    }
    
    // Show the more restrictive limit
    const minRemaining = Math.min(creditStatus.remainingDaily, creditStatus.remainingMonthly);
    return `${minRemaining} credits`;
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={className}
      title={`Daily: ${creditStatus.dailyUsed}/${creditStatus.dailyLimit} | Monthly: ${creditStatus.monthlyUsed}/${creditStatus.monthlyLimit} | Tier: ${subscriptionTier || 'free'}`}
    >
      {getDisplayText()}
    </Badge>
  );
};