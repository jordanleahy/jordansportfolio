import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StreetVisionRecord {
  id: string;
  user_id: string;
  user_prompt: string;
  original_image_url: string;
  transformed_image_url?: string;
  vision_analysis?: string;
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed';
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

interface UseStreetVisionProcessingReturn {
  currentRecord: StreetVisionRecord | null;
  isProcessing: boolean;
  startProcessing: (imagePath: string, prompt: string, originalFilename: string) => Promise<void>;
  clearProcessing: () => void;
  error: string | null;
}

export const useStreetVisionProcessing = (): UseStreetVisionProcessingReturn => {
  const [currentRecord, setCurrentRecord] = useState<StreetVisionRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  const clearProcessing = useCallback(() => {
    setCurrentRecord(null);
    setIsProcessing(false);
    setError(null);
    
    // Clean up subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  }, []);

  const setupRealtimeSubscription = useCallback((recordId: string) => {
    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Set up new subscription for this specific record
    const channel = supabase
      .channel(`street-vision-${recordId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'street_vision_generations',
          filter: `id=eq.${recordId}`
        },
        (payload) => {
          console.log('Street vision update received:', payload);
          const updatedRecord = payload.new as StreetVisionRecord;
          setCurrentRecord(updatedRecord);

          // Check if processing is complete
          if (updatedRecord.status === 'completed') {
            setIsProcessing(false);
            toast({
              title: "Street transformation complete!",
              description: "Your street vision has been generated successfully."
            });
            
            // Clean up subscription after completion
            setTimeout(() => {
              if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
              }
            }, 1000);
          } else if (updatedRecord.status === 'failed') {
            setIsProcessing(false);
            setError(updatedRecord.error_message || 'Processing failed');
            toast({
              title: "Processing failed",
              description: updatedRecord.error_message || "An error occurred during processing",
              variant: "destructive"
            });
            
            // Clean up subscription after failure
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

  const startProcessing = useCallback(async (imagePath: string, prompt: string, originalFilename: string) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the street-vision-agent edge function with the full project URL
      const response = await supabase.functions.invoke('street-vision-agent', {
        body: {
          originalImagePath: imagePath,
          userPrompt: prompt,
          originalFilename
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const result = response.data;
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Set initial record and start real-time subscription
      const initialRecord: StreetVisionRecord = {
        id: result.recordId,
        user_id: result.userId || '',
        user_prompt: prompt,
        original_image_url: result.originalImageUrl || '',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setCurrentRecord(initialRecord);
      setupRealtimeSubscription(result.recordId);

      toast({
        title: "Processing started",
        description: "Analyzing your street photo and generating transformation..."
      });

    } catch (err) {
      console.error('Error starting street vision processing:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsProcessing(false);
      
      toast({
        title: "Error starting processing",
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  }, [setupRealtimeSubscription]);

  // Cleanup on unmount
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