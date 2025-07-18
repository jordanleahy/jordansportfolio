import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { JobApplication, JobApplicationInput } from "@/types/jobApplication";
import { useToast } from "@/hooks/use-toast";

export const useJobApplications = () => {
  return useQuery({
    queryKey: ["job-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as JobApplication[];
    },
  });
};

export const useCreateJobApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: JobApplicationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("job_applications")
        .insert([{ ...input, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data as JobApplication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      toast({
        title: "Application added",
        description: "Your job application has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save job application. Please try again.",
        variant: "destructive",
      });
      console.error("Create job application error:", error);
    },
  });
};

export const useUpdateJobApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & JobApplicationInput) => {
      const { data, error } = await supabase
        .from("job_applications")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as JobApplication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      toast({
        title: "Application updated",
        description: "Your job application has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update job application. Please try again.",
        variant: "destructive",
      });
      console.error("Update job application error:", error);
    },
  });
};

export const useDeleteJobApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      toast({
        title: "Application deleted",
        description: "Your job application has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete job application. Please try again.",
        variant: "destructive",
      });
      console.error("Delete job application error:", error);
    },
  });
};