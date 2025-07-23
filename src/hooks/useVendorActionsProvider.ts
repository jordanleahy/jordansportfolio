
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Vendor } from '@/types/vendor';

export const useVendorActionsProvider = (refetchVendors: () => void) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const { toast } = useToast();

  const handleDeleteVendor = (vendor: Vendor) => {
    setVendorToDelete(vendor);
    setDeleteModalOpen(true);
  };

  const confirmDeleteVendor = async () => {
    if (!vendorToDelete) return;

    try {
      console.log('Attempting to delete vendor:', vendorToDelete.id);
      const { data, error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorToDelete.id)
        .select('*');
        
      console.log('Delete result:', { data, error });
      
      if (error) {
        console.error('Supabase delete error:', error);
        if (error.code === 'PGRST116') {
          toast({
            title: "Permission Denied",
            description: "You can only delete vendors you created.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to delete vendor: ${error.message}`,
            variant: "destructive",
          });
        }
        return;
      }
      
      if (!data || data.length === 0) {
        toast({
          title: "Not Found",
          description: "Vendor not found or you do not have permission to delete it.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Vendor deleted successfully!",
      });
      refetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor: Network or unexpected error",
        variant: "destructive",
      });
    } finally {
      setDeleteModalOpen(false);
      setVendorToDelete(null);
    }
  };

  return {
    deleteModalOpen,
    setDeleteModalOpen,
    vendorToDelete,
    handleDeleteVendor,
    confirmDeleteVendor
  };
};
