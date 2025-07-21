
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JobApplication, JobApplicationInput } from "@/types/jobApplication";

// Optimized job applications with aggressive caching
export const useOptimizedJobApplications = () => {
  return useQuery({
    queryKey: ['job-applications'],
    queryFn: async (): Promise<JobApplication[]> => {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });
};

export const useOptimizedCreateJobApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: JobApplicationInput): Promise<JobApplication> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('job_applications')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onMutate: async (newApplication) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['job-applications'] });

      // Snapshot the previous value
      const previousApplications = queryClient.getQueryData<JobApplication[]>(['job-applications']);

      // Optimistically update to the new value
      const optimisticApplication: JobApplication = {
        id: 'temp-' + Date.now(),
        ...newApplication,
        user_id: 'temp-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<JobApplication[]>(['job-applications'], old => 
        old ? [optimisticApplication, ...old] : [optimisticApplication]
      );

      return { previousApplications };
    },
    onError: (err, newApplication, context) => {
      // Rollback to previous value on error
      queryClient.setQueryData(['job-applications'], context?.previousApplications);
      toast({
        title: "Error",
        description: "Failed to create job application",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      // Update cache with real data
      queryClient.setQueryData<JobApplication[]>(['job-applications'], old => 
        old ? [data, ...old.filter(app => !app.id.startsWith('temp-'))] : [data]
      );
      toast({
        title: "Success",
        description: "Job application created successfully",
      });
    },
  });
};

export const useOptimizedUpdateJobApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<JobApplicationInput>): Promise<JobApplication> => {
      const { data: result, error } = await supabase
        .from('job_applications')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onMutate: async ({ id, ...updateData }) => {
      await queryClient.cancelQueries({ queryKey: ['job-applications'] });

      const previousApplications = queryClient.getQueryData<JobApplication[]>(['job-applications']);

      // Optimistically update
      queryClient.setQueryData<JobApplication[]>(['job-applications'], old => 
        old ? old.map(app => 
          app.id === id ? { ...app, ...updateData, updated_at: new Date().toISOString() } : app
        ) : []
      );

      return { previousApplications };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['job-applications'], context?.previousApplications);
      toast({
        title: "Error",
        description: "Failed to update job application",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData<JobApplication[]>(['job-applications'], old => 
        old ? old.map(app => app.id === data.id ? data : app) : [data]
      );
      toast({
        title: "Success",
        description: "Job application updated successfully",
      });
    },
  });
};

export const useOptimizedDeleteJobApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['job-applications'] });

      const previousApplications = queryClient.getQueryData<JobApplication[]>(['job-applications']);

      // Optimistically remove from cache
      queryClient.setQueryData<JobApplication[]>(['job-applications'], old => 
        old ? old.filter(app => app.id !== id) : []
      );

      return { previousApplications };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['job-applications'], context?.previousApplications);
      toast({
        title: "Error",
        description: "Failed to delete job application",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job application deleted successfully",
      });
    },
  });
};
