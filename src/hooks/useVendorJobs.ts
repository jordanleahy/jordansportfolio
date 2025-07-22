import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface VendorJob {
  id: string;
  vendor_id: string;
  job_title: string;
  job_url: string;
  job_description: string;
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

export const useCreateVendorJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobData: {
      vendor_id: string;
      job_title: string;
      job_url: string;
      job_description: string;
    }) => {
      const { data, error } = await supabase
        .from("vendor_jobs")
        .insert([
          {
            ...jobData,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-jobs", data.vendor_id] });
      toast({
        title: "Success",
        description: "Job posting created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create job posting",
        variant: "destructive",
      });
      console.error("Error creating job:", error);
    },
  });
};

export const useUpdateVendorJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      job_title,
      job_url,
      job_description,
    }: {
      id: string;
      job_title: string;
      job_url: string;
      job_description: string;
    }) => {
      const { data, error } = await supabase
        .from("vendor_jobs")
        .update({ job_title, job_url, job_description })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-jobs", data.vendor_id] });
      toast({
        title: "Success",
        description: "Job posting updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job posting",
        variant: "destructive",
      });
      console.error("Error updating job:", error);
    },
  });
};

export const useDeleteVendorJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vendor_jobs")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return id;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-jobs"] });
      toast({
        title: "Success",
        description: "Job posting deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete job posting",
        variant: "destructive",
      });
      console.error("Error deleting job:", error);
    },
  });
};