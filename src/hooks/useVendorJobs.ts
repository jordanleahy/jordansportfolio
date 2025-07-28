import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEntityActionsWrapper } from './useEntityActionsWrapper';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface VendorJob {
  id: string;
  vendor_id: string;
  job_title: string;
  job_url: string;
  job_description: string;
  resume_text?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useVendorJobs = (vendorId: string) => {
  return useQuery({
    queryKey: ["vendor-jobs", vendorId],
    queryFn: async (): Promise<VendorJob[]> => {
      const { data, error } = await supabase
        .from("vendor_jobs")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!vendorId,
  });
};

interface VendorJobInput {
  vendor_id: string;
  job_title: string;
  job_url: string;
  job_description: string;
}

const useVendorJobActions = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  
  const baseActions = useEntityActionsWrapper<VendorJob, VendorJobInput>({
    tableName: 'vendor_jobs',
    queryKey: ['vendor-jobs'],
    entityName: 'Job posting',
    onSuccessMessage: {
      create: 'Job posting created successfully',
      update: 'Job posting updated successfully', 
      delete: 'Job posting deleted successfully',
    },
    invalidateQueries: (job) => [
      ['vendor-jobs'],
      ...(job ? [['vendor-jobs', job.vendor_id]] : []),
    ],
  });

  // Enhanced security wrapper for mutations
  const secureCreate = {
    ...baseActions.create,
    mutate: (data: VendorJobInput, options?: any) => {
      if (!user || !isAdmin) {
        throw new Error('Admin authentication required');
      }
      return baseActions.create.mutate(data, options);
    },
    mutateAsync: (data: VendorJobInput) => {
      if (!user || !isAdmin) {
        throw new Error('Admin authentication required');
      }
      return baseActions.create.mutateAsync(data);
    },
  };

  const secureUpdate = {
    ...baseActions.update,
    mutate: (input: { id: string } & Partial<VendorJobInput>, options?: any) => {
      if (!user || !isAdmin) {
        throw new Error('Admin authentication required');
      }
      return baseActions.update.mutate(input, options);
    },
    mutateAsync: (input: { id: string } & Partial<VendorJobInput>) => {
      if (!user || !isAdmin) {
        throw new Error('Admin authentication required');
      }
      return baseActions.update.mutateAsync(input);
    },
  };

  const secureDelete = {
    ...baseActions.delete,
    mutate: (id: string, options?: any) => {
      if (!user || !isAdmin) {
        throw new Error('Admin authentication required');
      }
      return baseActions.delete.mutate(id, options);
    },
    mutateAsync: (id: string) => {
      if (!user || !isAdmin) {
        throw new Error('Admin authentication required');
      }
      return baseActions.delete.mutateAsync(id);
    },
  };

  return {
    create: secureCreate,
    update: secureUpdate,
    delete: secureDelete,
  };
};

export const useCreateVendorJob = () => useVendorJobActions().create;
export const useUpdateVendorJob = () => useVendorJobActions().update;
export const useDeleteVendorJob = () => useVendorJobActions().delete;