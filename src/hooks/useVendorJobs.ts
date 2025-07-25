import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEntityActionsWrapper } from './useEntityActionsWrapper';

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

const useVendorJobActions = () => useEntityActionsWrapper<VendorJob, VendorJobInput>({
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

export const useCreateVendorJob = () => useVendorJobActions().create;
export const useUpdateVendorJob = () => useVendorJobActions().update;
export const useDeleteVendorJob = () => useVendorJobActions().delete;