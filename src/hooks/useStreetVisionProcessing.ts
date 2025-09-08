/**
 * STREET VISION PROCESSING HOOK - Real-time AI Transformation Management
 * 
 * PURPOSE:
 * This custom React hook manages the complete lifecycle of street photo AI transformations,
 * including triggering the processing, real-time status updates, error handling, and result
 * management. It abstracts the complexity of coordinating with the street-vision-agent edge
 * function and provides a clean interface for React components.
 * 
 * REAL-TIME WORKFLOW:
 * 1. startProcessing() calls the street-vision-agent edge function
 * 2. Sets up Supabase real-time subscription for the created database record
 * 3. Receives live updates as the record status changes: pending → analyzing → generating → completed/failed
 * 4. Updates local state and shows user notifications based on status changes
 * 5. Automatically cleans up subscriptions when processing completes
 * 
 * DATABASE INTEGRATION:
 * - Monitors street_vision_generations table via real-time subscriptions
 * - Tracks status changes, error messages, processing times, and results
 * - Provides automatic cleanup of subscriptions to prevent memory leaks
 * 
 * STATE MANAGEMENT:
 * - currentRecord: Full database record with all processing details and results
 * - isProcessing: Boolean flag for UI loading states and button disabling
 * - error: Error message for user-friendly error display and retry functionality
 * 
 * EDGE FUNCTION COORDINATION:
 * - Calls street-vision-agent with image path, prompt, and filename
 * - Handles authentication via Supabase JWT tokens automatically
 * - Manages all error scenarios and network failures gracefully
 * 
 * CLEANUP & MEMORY MANAGEMENT:
 * - Automatically removes Supabase channels when processing completes
 * - Provides manual cleanup via clearProcessing() function
 * - Handles component unmounting to prevent memory leaks
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { ThemeLifecycleStatus } from '@/types/enums/status';

/**
 * Database record structure for street vision transformations
 * Uses the actual database schema for type safety
 */
type StreetVisionRecord = Database['public']['Tables']['street_vision_generations']['Row'];

/**
 * Hook return interface defining all available state and actions
 */
interface UseStreetVisionProcessingReturn {
  currentRecord: StreetVisionRecord | null;           // Current processing record with results
  isProcessing: boolean;                              // True during active transformation
  startProcessing: (imagePath: string, prompt: string, originalFilename: string) => Promise<void>; // Initiate processing
  clearProcessing: () => void;                        // Reset state and cleanup
  error: string | null;                               // Error message for display
  refreshRecord: () => Promise<void>;                 // Manual refresh function
}

/**
 * Custom hook for managing Street Vision AI transformations
 * Handles edge function calls, real-time updates, and state management
 */
export const useStreetVisionProcessing = (): UseStreetVisionProcessingReturn => {
  // Core state for processing workflow
  const [currentRecord, setCurrentRecord] = useState<StreetVisionRecord | null>(null);  // Database record
  const [isProcessing, setIsProcessing] = useState(false);                              // Processing flag
  const [error, setError] = useState<string | null>(null);                             // Error state
  const subscriptionRef = useRef<any>(null);                                           // Real-time subscription
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);                      // Fallback polling

  /**
   * Fetches the latest record from database manually
   * Used for manual refresh and fallback polling
   */
  const fetchRecord = useCallback(async (recordId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('street_vision_generations')
        .select('*')
        .eq('id', recordId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      console.log('🔍 PROCESSING DEBUG: Manual fetch result:', data);
      setCurrentRecord(data);
      
      // If processing is complete, stop polling
      if (data?.status === 'completed' || data?.status === 'failed') {
        setIsProcessing(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching record:', err);
      throw err;
    }
  }, []);

  /**
   * Resets all processing state and cleans up subscriptions and polling
   * Call this when user removes image, retries, or component unmounts
   */
  const clearProcessing = useCallback(() => {
    setCurrentRecord(null);       // Clear database record
    setIsProcessing(false);       // Reset processing flag
    setError(null);              // Clear any error messages
    
    // Clean up real-time subscription to prevent memory leaks
    if (subscriptionRef.current) {
      console.log('🔍 PROCESSING DEBUG: Cleaning up subscription');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    // Clean up polling interval
    if (pollingIntervalRef.current) {
      console.log('🔍 PROCESSING DEBUG: Cleaning up polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Manual refresh function to fetch latest record state
   */
  const refreshRecord = useCallback(async () => {
    if (!currentRecord?.id) return;
    
    console.log('🔍 PROCESSING DEBUG: Manual refresh requested for record:', currentRecord.id);
    try {
      await fetchRecord(currentRecord.id);
    } catch (err) {
      console.error('Manual refresh failed:', err);
    }
  }, [currentRecord?.id, fetchRecord]);

  /**
   * Sets up fallback polling for cases where real-time updates fail
   */
  const setupFallbackPolling = useCallback((recordId: string) => {
    console.log('🔍 PROCESSING DEBUG: Setting up fallback polling for record:', recordId);
    
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Poll every 5 seconds while processing
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log('🔍 PROCESSING DEBUG: Polling for record updates:', recordId);
        await fetchRecord(recordId);
      } catch (err) {
        console.error('Polling failed:', err);
      }
    }, 5000);
  }, [fetchRecord]);

  /**
   * Sets up real-time subscription to monitor database record updates
   * Now with consistent naming and fallback polling
   * 
   * @param recordId - Database record ID to monitor
   */
  const setupRealtimeSubscription = useCallback((recordId: string) => {
    console.log('🔍 PROCESSING DEBUG: Setting up subscription for record ID:', recordId);
    
    // Clean up any existing subscription first
    if (subscriptionRef.current) {
      console.log('🔍 PROCESSING DEBUG: Cleaning up existing subscription');
      supabase.removeChannel(subscriptionRef.current);
    }

    // Use consistent channel naming (matches what edge function expects)
    const channel = supabase
      .channel(`street-vision-processing-${recordId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',                              // Listen for record updates
          schema: 'public',                             // Database schema
          table: 'street_vision_generations',           // Target table
          filter: `id=eq.${recordId}`                   // Only this specific record
        },
        (payload) => {
          console.log('🔍 PROCESSING DEBUG: Real-time update received for record:', recordId);
          console.log('🔍 PROCESSING DEBUG: Payload:', payload);
          console.log('🔍 PROCESSING DEBUG: New data:', payload.new);
          
          const updatedRecord = payload.new as StreetVisionRecord;
          console.log('🔍 PROCESSING DEBUG: Updated record status:', updatedRecord.status);
          console.log('🔍 PROCESSING DEBUG: Updated record transformed_image_url:', updatedRecord.transformed_image_url);
          console.log('🔍 PROCESSING DEBUG: Updated record ID:', updatedRecord.id);
          
          setCurrentRecord(updatedRecord);              // Update local state

          // Stop polling since real-time is working
          if (pollingIntervalRef.current) {
            console.log('🔍 PROCESSING DEBUG: Real-time working, stopping polling');
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          // Handle completion - show success and cleanup
          if (updatedRecord.status === 'completed') {
            console.log('🔍 PROCESSING DEBUG: Processing completed via real-time!');
            setIsProcessing(false);
            toast({
              title: "Street transformation complete!",
              description: "Your street vision has been generated successfully."
            });
            
            // Clean up immediately since we're done
            if (subscriptionRef.current) {
              supabase.removeChannel(subscriptionRef.current);
              subscriptionRef.current = null;
            }
            
          // Handle failure - show error and cleanup  
          } else if (updatedRecord.status === 'failed') {
            console.log('🔍 PROCESSING DEBUG: Processing failed via real-time!');
            setIsProcessing(false);
            setError(updatedRecord.error_message || 'Processing failed');
            toast({
              title: "Processing failed",
              description: updatedRecord.error_message || "An error occurred during processing",
              variant: "destructive"
            });
            
            // Clean up immediately since we're done
            if (subscriptionRef.current) {
              supabase.removeChannel(subscriptionRef.current);
              subscriptionRef.current = null;
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
    
    // Set up fallback polling in case real-time doesn't work
    setupFallbackPolling(recordId);
  }, [setupFallbackPolling]);

  /**
   * Initiates the AI street transformation process
   * Calls the street-vision-agent edge function and sets up real-time monitoring
   * 
   * @param imagePath - Supabase storage path of the uploaded street photo
   * @param prompt - User's description of desired street transformation
   * @param originalFilename - Original filename for reference and metadata
   */
  const startProcessing = useCallback(async (imagePath: string, prompt: string, originalFilename: string) => {
    setError(null);           // Clear any previous errors
    setIsProcessing(true);    // Set loading state for UI

    try {
      // Verify user authentication (required for edge function)
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the street-vision-agent edge function
      // This will: 1) Create DB record, 2) Analyze image with GPT-5, 3) Generate transformation
      const response = await supabase.functions.invoke('street-vision-agent', {
        body: {
          originalImagePath: imagePath,    // Storage path for image access
          userPrompt: prompt,              // Transformation description
          originalFilename                 // Metadata for record keeping
        }
      });

      // Handle edge function errors
      if (response.error) {
        throw new Error(response.error);
      }

      const result = response.data;
      
      // Handle application-level errors from edge function
      if (result.error) {
        throw new Error(result.error);
      }

      // Create initial local record to display immediately
      // This is a partial record until we get real-time updates with complete data
      const initialRecord = {
        id: result.recordId,
        user_id: result.userId || '',
        user_prompt: prompt,
        original_image_url: result.originalImageUrl || '',
        status: ThemeLifecycleStatus.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Set default values for required fields
        error_message: null,
        image_generation_prompt: null,
        image_model: 'gpt-image-1',
        processing_time_ms: null,
        prompt_created_at: null,
        prompt_creation_status: null,
        prompt_model: 'gpt-5-2025-08-07',
        transformed_image_url: null,
        vision_analysis: null,
        original_filename: originalFilename
      } as StreetVisionRecord;

      // Only set current record after successful edge function call
      console.log('🔍 PROCESSING DEBUG: Setting initial record with ID:', result.recordId);
      console.log('🔍 PROCESSING DEBUG: Initial record data:', initialRecord);
      setCurrentRecord(initialRecord);           // Update local state
      setupRealtimeSubscription(result.recordId); // Start monitoring updates

      toast({
        title: "Processing started",
        description: "Analyzing your street photo and generating transformation..."
      });

    } catch (err) {
      // Handle all errors gracefully with user feedback
      console.error('Error starting street vision processing:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsProcessing(false);
      setCurrentRecord(null); // Reset current record on error so input container stays visible
      
      toast({
        title: "Error starting processing",
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  }, [setupRealtimeSubscription]);

  // Cleanup real-time subscriptions and polling when component unmounts
  // Prevents memory leaks and orphaned subscriptions
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        console.log('🔍 PROCESSING DEBUG: Cleanup on unmount - removing subscription');
        supabase.removeChannel(subscriptionRef.current);
      }
      if (pollingIntervalRef.current) {
        console.log('🔍 PROCESSING DEBUG: Cleanup on unmount - clearing polling');
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    currentRecord,
    isProcessing,
    startProcessing,
    clearProcessing,
    error,
    refreshRecord
  };
};