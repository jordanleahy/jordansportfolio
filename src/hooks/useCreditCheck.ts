import { useUsageSummary } from './useUsageSummary';
import { useUsageEnforcement, type UsageType } from './useUsageEnforcement';

export interface CreditStatus {
  hasCredits: boolean;
  remainingDaily: number;
  remainingMonthly: number;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  isLoading: boolean;
  blockingLimit: 'daily' | 'monthly' | null;
  subscriptionTier: string;
}

export const useCreditCheck = () => {
  const { data, isLoading, subscriptionTier } = useUsageSummary();
  const { checkAndEnforceUsage } = useUsageEnforcement();

  const getCreditStatus = (): CreditStatus => {
    if (isLoading || !data) {
      return {
        hasCredits: true,
        remainingDaily: 0,
        remainingMonthly: 0,
        dailyLimit: 0,
        monthlyLimit: 0,
        dailyUsed: 0,
        monthlyUsed: 0,
        isLoading: true,
        blockingLimit: null,
        subscriptionTier: 'free'
      };
    }

    const dailyUsed = data.limits.daily.used;
    const dailyLimit = data.limits.daily.limit;
    const monthlyUsed = data.limits.monthly.used;
    const monthlyLimit = data.limits.monthly.limit;
    
    const remainingDaily = Math.max(0, dailyLimit - dailyUsed);
    const remainingMonthly = Math.max(0, monthlyLimit - monthlyUsed);
    
    // Determine what's blocking the user (if anything)
    let blockingLimit: 'daily' | 'monthly' | null = null;
    if (remainingDaily <= 0) blockingLimit = 'daily';
    else if (remainingMonthly <= 0) blockingLimit = 'monthly';
    
    const hasCredits = remainingDaily > 0 && remainingMonthly > 0;

    return {
      hasCredits,
      remainingDaily,
      remainingMonthly,
      dailyLimit,
      monthlyLimit,
      dailyUsed,
      monthlyUsed,
      isLoading: false,
      blockingLimit,
      subscriptionTier: subscriptionTier || 'free'
    };
  };

  const enforceUsage = async (usageType: UsageType, amount: number = 1) => {
    return await checkAndEnforceUsage(usageType, amount);
  };

  const getBlockingMessage = (creditStatus: CreditStatus): string => {
    if (creditStatus.blockingLimit === 'daily') {
      return `Daily limit reached (${creditStatus.dailyUsed}/${creditStatus.dailyLimit}). Resets at midnight.`;
    }
    if (creditStatus.blockingLimit === 'monthly') {
      return `Monthly limit reached (${creditStatus.monthlyUsed}/${creditStatus.monthlyLimit}). Upgrade for more credits.`;
    }
    return '';
  };

  return {
    getCreditStatus,
    enforceUsage,
    getBlockingMessage
  };
};