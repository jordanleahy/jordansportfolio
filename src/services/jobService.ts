import { supabase } from "@/integrations/supabase/client";
import type { Job } from "@/types/job";

export const jobService = {
  // Fetch all jobs with optional filters
  async getJobs(filters?: {
    search?: string;
    sortBy?: string;
    limit?: number;
  }): Promise<Job[]> {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true);

    // Apply search filter
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(`title.ilike.${searchTerm},company.ilike.${searchTerm}`);
    }

    // Apply sorting
    if (filters?.sortBy === 'company') {
      query = query.order('company');
    } else if (filters?.sortBy === 'title') {
      query = query.order('title');
    } else {
      query = query.order('date_posted', { ascending: false });
    }

    // Apply limit
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }

    return data || [];
  },

  // Get user's bookmarked jobs
  async getBookmarkedJobs(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('job_bookmarks')
      .select('job_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }

    return data?.map(bookmark => bookmark.job_id) || [];
  },

  // Toggle bookmark for a job
  async toggleBookmark(userId: string, jobId: string): Promise<boolean> {
    // Check if bookmark exists
    const { data: existing } = await supabase
      .from('job_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single();

    if (existing) {
      // Remove bookmark
      const { error } = await supabase
        .from('job_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobId);

      if (error) {
        console.error('Error removing bookmark:', error);
        throw error;
      }
      return false;
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('job_bookmarks')
        .insert({ user_id: userId, job_id: jobId });

      if (error) {
        console.error('Error adding bookmark:', error);
        throw error;
      }
      return true;
    }
  },

  // Trigger job scraping
  async scrapeJobs(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Triggering job monitoring...');
      const { data, error } = await supabase.functions.invoke('job-monitor', {
        body: {}
      });

      if (error) {
        console.error('Function invoke error:', error);
        throw error;
      }

      console.log('Job monitoring response:', data);
      return data || { success: true, message: 'Job monitoring completed' };
    } catch (error) {
      console.error('Error triggering job monitoring:', error);
      throw error;
    }
  }
};