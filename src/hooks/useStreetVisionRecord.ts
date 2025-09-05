/**
 * STREET VISION RECORD HOOK - Real-time Database Record Management
 * 
 * PURPOSE:
 * This hook provides direct database access to street_vision_generations records
 * with real-time updates. It ensures the UI always has the latest data including
 * transformed image URLs, analysis results, and processing status.
 * 
 * REAL-TIME FEATURES:
 * - Subscribes to postgres_changes for real-time updates
 * - Automatically updates local state when database changes
 * - Provides immediate UI updates without polling
 * 
 * USE CASES:
 * - Direct record fetching by ID
 * - Real-time monitoring of specific records
 * - Backup for edge function processing hooks
 * - Data validation and debugging
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type StreetVisionRecord = Database['public']['Tables']['street_vision_generations']['Row'];

interface UseStreetVisionRecordReturn {
  record: StreetVisionRecord | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStreetVisionRecord = (recordId: string | null): UseStreetVisionRecordReturn => {
  const [record, setRecord] = useState<StreetVisionRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecord = useCallback(async () => {
    if (!recordId) return;
    
    console.log('🔍 RECORD DEBUG: Fetching record with ID:', recordId);
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('street_vision_generations')
        .select('*')
        .eq('id', recordId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      console.log('🔍 RECORD DEBUG: Fetched record data:', data);
      console.log('🔍 RECORD DEBUG: Record status:', data?.status);
      console.log('🔍 RECORD DEBUG: Record transformed_image_url:', data?.transformed_image_url);
      setRecord(data);
    } catch (err) {
      console.error('Error fetching street vision record:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch record');
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  // Fetch record on mount and when recordId changes
  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  // Set up real-time subscription
  useEffect(() => {
    if (!recordId) return;

    console.log('🔍 RECORD DEBUG: Setting up subscription for record ID:', recordId);

    const channel = supabase
      .channel(`street-vision-record-${recordId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'street_vision_generations',
          filter: `id=eq.${recordId}`
        },
        (payload) => {
          console.log('🔍 RECORD DEBUG: Real-time update received for record:', recordId);
          console.log('🔍 RECORD DEBUG: Payload:', payload);
          
          if (payload.eventType === 'UPDATE') {
            console.log('🔍 RECORD DEBUG: Updating record with new data:', payload.new);
            setRecord(payload.new as StreetVisionRecord);
          } else if (payload.eventType === 'DELETE') {
            console.log('🔍 RECORD DEBUG: Record deleted');
            setRecord(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recordId]);

  const refetch = useCallback(async () => {
    await fetchRecord();
  }, [fetchRecord]);

  return {
    record,
    loading,
    error,
    refetch
  };
};