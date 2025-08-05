import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type UsageType = 'image_generation' | 'dalle_image' | 'text_generation';

interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  usage_type: string;
  message?: string;
}

export const useUsageEnforcement = () => {
  const checkAndEnforceUsage = async (
    usageType: UsageType, 
    amount: number = 1
  ): Promise<UsageCheckResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-usage-limits', {
        body: { usage_type: usageType, amount }
      });

      if (error) {
        throw error;
      }

      if (!data.allowed) {
        toast.error(data.message || `Usage limit exceeded for ${usageType}`);
      }

      return data;
    } catch (error) {
      console.error('Usage check failed:', error);
      toast.error('Failed to check usage limits. Please try again.');
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        usage_type: usageType,
        message: 'Usage check failed'
      };
    }
  };

  return { checkAndEnforceUsage };
};