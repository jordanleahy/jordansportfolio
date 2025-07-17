import { supabase } from "@/integrations/supabase/client";
import type { JobTarget, JobMonitoringConfig, JobMonitoringState } from "@/types/jobMonitoring";

export const jobMonitoringService = {
  // Get all job targets
  async getJobTargets(): Promise<JobTarget[]> {
    const { data, error } = await supabase
      .from('job_targets')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching job targets:', error);
      throw error;
    }

    return data || [];
  },

  // Get user's monitoring configuration
  async getMonitoringConfig(userId: string): Promise<JobMonitoringConfig | null> {
    const { data, error } = await supabase
      .from('job_monitoring_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching monitoring config:', error);
      throw error;
    }

    return data;
  },

  // Update monitoring configuration
  async updateMonitoringConfig(config: Partial<JobMonitoringConfig> & { user_id: string }): Promise<JobMonitoringConfig> {
    const { data, error } = await supabase
      .from('job_monitoring_config')
      .upsert(config)
      .select()
      .single();

    if (error) {
      console.error('Error updating monitoring config:', error);
      throw error;
    }

    return data;
  },

  // Get monitoring state for all targets
  async getMonitoringStates(): Promise<JobMonitoringState[]> {
    const { data, error } = await supabase
      .from('job_monitoring_state')
      .select(`
        *,
        job_targets!inner(name, url, ats_platform)
      `)
      .order('last_scraped_at', { ascending: false });

    if (error) {
      console.error('Error fetching monitoring states:', error);
      throw error;
    }

    return data || [];
  },

  // Add a new job target
  async addJobTarget(target: Omit<JobTarget, 'id' | 'created_at' | 'updated_at'>): Promise<JobTarget> {
    const { data, error } = await supabase
      .from('job_targets')
      .insert(target)
      .select()
      .single();

    if (error) {
      console.error('Error adding job target:', error);
      throw error;
    }

    return data;
  },

  // Update job target
  async updateJobTarget(id: string, updates: Partial<JobTarget>): Promise<JobTarget> {
    const { data, error } = await supabase
      .from('job_targets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job target:', error);
      throw error;
    }

    return data;
  },

  // Delete job target
  async deleteJobTarget(id: string): Promise<void> {
    const { error } = await supabase
      .from('job_targets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting job target:', error);
      throw error;
    }
  },

  // Trigger job monitoring
  async triggerMonitoring(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('job-monitor');

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error triggering job monitoring:', error);
      throw error;
    }
  }
};