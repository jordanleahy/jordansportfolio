import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PipelineProgress {
  type: string;
  progress: number;
  data?: any;
  error?: string;
}

interface PipelineState {
  isProcessing: boolean;
  progress: number;
  currentStage: string;
  error: string | null;
  result: any | null;
  events: PipelineProgress[];
}

interface UserIdeaPipelineHook {
  state: PipelineState;
  startPipeline: (description: string) => Promise<void>;
  reset: () => void;
}

export const useUserIdeaPipeline = (): UserIdeaPipelineHook => {
  const [state, setState] = useState<PipelineState>({
    isProcessing: false,
    progress: 0,
    currentStage: '',
    error: null,
    result: null,
    events: []
  });

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      currentStage: '',
      error: null,
      result: null,
      events: []
    });
  }, []);

  const startPipeline = useCallback(async (description: string) => {
    if (!description.trim()) {
      setState(prev => ({ ...prev, error: 'Description is required' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      currentStage: 'Starting pipeline...',
      error: null,
      result: null,
      events: []
    }));

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Create SSE connection to edge function
      const eventSource = new EventSource(
        `https://wgwmzfbnkovumqcvsxgd.functions.supabase.co/user-idea-streaming-image-pipeline`,
        {
          // Note: EventSource doesn't support custom headers or POST body
          // We need to use fetch with streaming instead
        }
      );

      // Since EventSource doesn't support POST with body, use fetch with streaming
      const response = await fetch(
        `https://wgwmzfbnkovumqcvsxgd.functions.supabase.co/user-idea-streaming-image-pipeline`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            description: description.trim(),
            userId: session.user.id,
            stream: true
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data && data !== '[DONE]') {
                try {
                  const event: PipelineProgress = JSON.parse(data);
                  
                  setState(prev => ({
                    ...prev,
                    progress: event.progress,
                    currentStage: getStageMessage(event.type, event.data),
                    events: [...prev.events, event],
                    error: event.error || null
                  }));

                  // Handle pipeline completion
                  if (event.type === 'pipeline_complete' && event.data) {
                    setState(prev => ({
                      ...prev,
                      isProcessing: false,
                      result: event.data
                    }));
                    break;
                  }

                  // Handle pipeline error
                  if (event.type === 'pipeline_error') {
                    setState(prev => ({
                      ...prev,
                      isProcessing: false,
                      error: event.error || 'Unknown error occurred'
                    }));
                    break;
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Pipeline error:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, []);

  return {
    state,
    startPipeline,
    reset
  };
};

const getStageMessage = (type: string, data?: any): string => {
  const stageMessages: Record<string, string> = {
    'theme_generation_start': 'Generating theme and posts...',
    'theme_generation_complete': `Generated "${data?.theme}" with ${data?.postCount} posts`,
    'database_import_start': 'Importing posts to database...',
    'database_import_complete': `Imported ${data?.insertedCount} posts`,
    'system_prompt_start': 'Generating AI system prompts...',
    'system_prompt_complete': 'System prompts generated',
    'image_prompt_start': 'Creating visual prompt...',
    'image_prompt_complete': 'Visual prompt created',
    'image_generation_start': 'Generating theme image...',
    'image_generation_complete': 'Theme image generated',
    'database_update_start': 'Finalizing...',
    'database_update_complete': 'Database updated',
    'pipeline_complete': data?.message || 'Pipeline completed successfully!'
  };

  return stageMessages[type] || data?.status || 'Processing...';
};