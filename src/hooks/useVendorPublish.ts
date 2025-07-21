import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface UseVendorPublishProps {
  vendorId: string;
  vendorSlug: string;
  category: string;
}

export function useVendorPublish({ vendorId, vendorSlug, category }: UseVendorPublishProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const togglePublishStatus = async (currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'draft' : 'completed';
    
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendorId);

      if (error) throw error;

      // Invalidate and refetch vendor data
      await queryClient.invalidateQueries({ queryKey: ['vendor', vendorSlug] });

      const actionText = newStatus === 'completed' ? 'published' : 'unpublished';
      const publicUrl = newStatus === 'completed' 
        ? `${window.location.origin}/public/vendors/${category}/${vendorSlug}`
        : null;

      toast({
        title: `Vendor ${actionText}`,
        description: newStatus === 'completed' 
          ? `Vendor is now publicly accessible at: ${publicUrl}`
          : 'Vendor is no longer publicly accessible',
      });

      // If published, offer to copy the public URL
      if (newStatus === 'completed' && publicUrl) {
        navigator.clipboard.writeText(publicUrl);
        setTimeout(() => {
          toast({
            title: "Public URL Copied",
            description: "The public vendor URL has been copied to your clipboard",
          });
        }, 1000);
      }

      return true;
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor status. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsPublishing(false);
    }
  };

  const getPublicUrl = (vendorSlug: string, category: string) => {
    return `${window.location.origin}/public/vendors/${category}/${vendorSlug}`;
  };

  return {
    togglePublishStatus,
    getPublicUrl,
    isPublishing,
  };
}