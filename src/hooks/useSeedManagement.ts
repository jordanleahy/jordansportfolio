import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSeedManagement = () => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const updatePostSeed = async (postId: string, seedId: string | null) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .update({ selected_seed_id: seedId })
        .eq('id', postId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating post seed:', error);
      toast({
        title: "Error",
        description: "Failed to update seed selection",
        variant: "destructive",
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updatePostSeed,
    updating,
  };
};