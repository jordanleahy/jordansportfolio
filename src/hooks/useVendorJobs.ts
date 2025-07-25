import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useEntityActions } from './useEntityActions';

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

const vendorJobActions = useEntityActions<VendorJob, VendorJobInput>({
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

export const useCreateVendorJob = () => {
  const { create } = vendorJobActions;
  return {
    ...create,
    mutate: (data: VendorJobInput, options?: any) => create.mutate({ data }, options),
    mutateAsync: (data: VendorJobInput) => create.mutateAsync({ data }),
  };
};

export const useUpdateVendorJob = () => {
  const { update } = vendorJobActions;
  return {
    ...update,
    mutate: ({ id, ...data }: { id: string } & Partial<VendorJobInput>, options?: any) => 
      update.mutate({ id, data }, options),
    mutateAsync: ({ id, ...data }: { id: string } & Partial<VendorJobInput>) => 
      update.mutateAsync({ id, data }),
  };
};

export const useDeleteVendorJob = () => vendorJobActions.delete;