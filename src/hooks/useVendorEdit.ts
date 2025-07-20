
import { useState, useCallback } from 'react';
import { type Vendor } from '@/types/vendor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateVendorData } from '@/utils/vendorValidation';

interface UseVendorEditProps {
  vendor: Vendor;
  onSave?: () => void;
}

export function useVendorEdit({ vendor, onSave }: UseVendorEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Vendor>(vendor);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  const startEdit = useCallback(() => {
    setIsEditing(true);
    setEditData(vendor);
    setHasChanges(false);
  }, [vendor]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditData(vendor);
    setHasChanges(false);
  }, [vendor]);

  const updateField = useCallback(<K extends keyof Vendor>(field: K, value: Vendor[K]) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  }, []);

  const saveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      const validation = validateVendorData(editData);
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: validation.errors[0]?.message || "Please fix the errors before saving",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('vendors')
        .update({
          ...validation.cleanedData,
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id);

      if (error) throw error;

      toast({
        title: "Draft Saved",
        description: "Your changes have been saved as a draft",
      });

      setHasChanges(false);
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [editData, vendor.id, toast]);

  const publishChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      const validation = validateVendorData(editData);
      if (!validation.isValid) {
        toast({
          title: "Validation Error",
          description: validation.errors[0]?.message || "Please fix the errors before publishing",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('vendors')
        .update({
          ...validation.cleanedData,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id);

      if (error) throw error;

      toast({
        title: "Changes Published",
        description: "Your changes are now live",
      });

      setIsEditing(false);
      setHasChanges(false);
      onSave?.();
      return true;
    } catch (error) {
      console.error('Error publishing changes:', error);
      toast({
        title: "Publish Failed",
        description: "Failed to publish changes. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [editData, vendor.id, toast, onSave]);

  return {
    isEditing,
    editData,
    hasChanges,
    isSaving,
    startEdit,
    cancelEdit,
    updateField,
    saveDraft,
    publishChanges,
  };
}
