import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { JobApplication, JobApplicationInput } from "@/types/jobApplication";
import { useToast } from "@/hooks/use-toast";
import { useEntityActionsWrapper } from './useEntityActionsWrapper';

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

const jobApplicationActions = useEntityActionsWrapper<JobApplication, JobApplicationInput>({
  tableName: 'job_applications',
  queryKey: ['job-applications'],
  entityName: 'Application',
  onSuccessMessage: {
    create: 'Your job application has been saved successfully.',
    update: 'Your job application has been updated successfully.',
    delete: 'Your job application has been deleted successfully.',
  },
});

export const useCreateJobApplication = () => jobApplicationActions.create;
export const useUpdateJobApplication = () => jobApplicationActions.update;
export const useDeleteJobApplication = () => jobApplicationActions.delete;

export const useJobApplicationByCompany = (companyName: string, jobDescriptionLink?: string) => {
  return useQuery({
    queryKey: ["job-application", companyName, jobDescriptionLink],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .eq("company_name", companyName)
        .eq("job_description_link", jobDescriptionLink || '')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      return data as JobApplication | null;
    },
    enabled: !!companyName,
  });
};

export const useCreateOrUpdateJobApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: JobApplicationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if job application already exists
      const { data: existingApp } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_name', input.company_name)
        .eq('job_description_link', input.job_description_link || '')
        .single();

      if (existingApp) {
        // Update existing application
        const { data, error } = await supabase
          .from('job_applications')
          .update({
            ...input,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingApp.id)
          .select()
          .single();

        if (error) throw error;
        return data as JobApplication;
      } else {
        // Create new application
        const { data, error } = await supabase
          .from('job_applications')
          .insert([{ ...input, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        return data as JobApplication;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["job-application"] });
      toast({
        title: "Application saved",
        description: "Your job application has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save job application. Please try again.",
        variant: "destructive",
      });
      console.error("Create/update job application error:", error);
    },
  });
};