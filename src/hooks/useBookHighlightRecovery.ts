import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBookHighlightRecovery = () => {
  const [isRecovering, setIsRecovering] = useState(false);

  const recoverStuckHighlights = async () => {
    try {
      setIsRecovering(true);
      console.log('🔧 Starting recovery of stuck book highlights...');

      const { data, error } = await supabase.functions.invoke('recover-stuck-highlights', {
        body: {}
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        const recoveredCount = data.recovered_count || 0;
        if (recoveredCount > 0) {
          toast.success(`Successfully recovered ${recoveredCount} stuck book research${recoveredCount > 1 ? 'es' : ''}`);
          console.log('✅ Recovery completed:', data);
        } else {
          toast.info('No stuck book research processes found');
          console.log('ℹ️ No stuck records found');
        }
        return data;
      } else {
        throw new Error(data?.error || 'Unknown error during recovery');
      }
    } catch (error) {
      console.error('❌ Error during recovery:', error);
      toast.error('Failed to recover stuck book research processes');
      throw error;
    } finally {
      setIsRecovering(false);
    }
  };

  return {
    recoverStuckHighlights,
    isRecovering
  };
};