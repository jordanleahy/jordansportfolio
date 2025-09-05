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

  /**
   * Resets all processing state and cleans up real-time subscriptions
   * Call this when user removes image, retries, or component unmounts
   */
  const clearProcessing = useCallback(() => {
    setCurrentRecord(null);       // Clear database record
    setIsProcessing(false);       // Reset processing flag
    setError(null);              // Clear any error messages
    
    // Clean up real-time subscription to prevent memory leaks
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  }, []);

  /**
   * Sets up real-time subscription to monitor database record updates
   * Listens for status changes and updates local state accordingly
   * 
   * @param recordId - Database record ID to monitor
   */
  const setupRealtimeSubscription = useCallback((recordId: string) => {
    // Clean up any existing subscription first
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Create new real-time subscription for this specific record
    const channel = supabase
      .channel(`street-vision-${recordId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',                              // Listen for record updates
          schema: 'public',                             // Database schema
          table: 'street_vision_generations',           // Target table
          filter: `id=eq.${recordId}`                   // Only this specific record
        },
        (payload) => {
          console.log('Street vision update received:', payload);
          console.log('Payload new data:', payload.new);
          
          const updatedRecord = payload.new as StreetVisionRecord;
          console.log('Updated record status:', updatedRecord.status);
          console.log('Updated record transformed_image_url:', updatedRecord.transformed_image_url);
          
          setCurrentRecord(updatedRecord);              // Update local state

          // Handle completion - show success and cleanup
          if (updatedRecord.status === 'completed') {
            console.log('Processing completed! Setting isProcessing to false');
            setIsProcessing(false);
            toast({
              title: "Street transformation complete!",
              description: "Your street vision has been generated successfully."
            });
            
            // Delay cleanup to ensure UI updates smoothly
            setTimeout(() => {
              if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
              }
            }, 1000);
            
          // Handle failure - show error and cleanup  
          } else if (updatedRecord.status === 'failed') {
            console.log('Processing failed! Setting isProcessing to false');
            setIsProcessing(false);
            setError(updatedRecord.error_message || 'Processing failed');
            toast({
              title: "Processing failed",
              description: updatedRecord.error_message || "An error occurred during processing",
              variant: "destructive"
            });
            
            // Delay cleanup to ensure error state is visible
            setTimeout(() => {
              if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
              }
            }, 1000);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;
  }, []);

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
        status: 'pending' as const,
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

  // Cleanup real-time subscriptions when component unmounts
  // Prevents memory leaks and orphaned subscriptions
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  return {
    currentRecord,
    isProcessing,
    startProcessing,
    clearProcessing,
    error
  };
};