import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface StoryRecording {
  id: string;
  user_id: string;
  post_id: string;
  story_type: 'childrens_story' | 'convincing_story';
  generated_script: string;
  audio_file_url?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStoryRecording {
  post_id: string;
  story_type: 'childrens_story' | 'convincing_story';
  generated_script: string;
  audio_file_url?: string;
  duration_seconds?: number;
}

export interface GenerateStoryScriptParams {
  post_content: string;
  story_type: 'childrens_story' | 'convincing_story';
  post_title?: string;
}

// Hook to generate story script
export const useGenerateStoryScript = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (params: GenerateStoryScriptParams) => {
      console.log('Generating story script with params:', params);
      
      const { data, error } = await supabase.functions.invoke('generate-story-script', {
        body: params
      });

      if (error) {
        console.error('Story script generation error:', error);
        throw new Error(error.message || 'Failed to generate story script');
      }

      if (!data || !data.script) {
        throw new Error('No script generated');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Story script generated successfully');
    },
    onError: (error) => {
      console.error('Error generating story script:', error);
      toast({
        title: "Generation Failed",
        description: error.message || 'Failed to generate story script. Please try again.',
        variant: "destructive",
      });
    },
  });
};

// Hook to fetch story recordings
export const useStoryRecordings = (postId?: string) => {
  return useQuery({
    queryKey: ['story-recordings', postId],
    queryFn: async () => {
      let query = supabase
        .from('story_recordings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (postId) {
        query = query.eq('post_id', postId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching story recordings:', error);
        throw error;
      }

      return data as StoryRecording[];
    },
    enabled: true,
  });
};

// Hook to create story recording
export const useCreateStoryRecording = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recording: CreateStoryRecording) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      console.log('Creating story recording:', recording);

      const { data, error } = await supabase
        .from('story_recordings')
        .insert([{
          ...recording,
          user_id: user.user.id,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating story recording:', error);
        throw error;
      }

      return data as StoryRecording;
    },
    onSuccess: (data) => {
      console.log('Story recording created successfully:', data.id);
      queryClient.invalidateQueries({ queryKey: ['story-recordings'] });
      toast({
        title: "Recording Saved",
        description: "Your story recording has been saved successfully!",
      });
    },
    onError: (error) => {
      console.error('Error creating story recording:', error);
      toast({
        title: "Save Failed",
        description: error.message || 'Failed to save story recording. Please try again.',
        variant: "destructive",
      });
    },
  });
};

// Hook to update story recording (e.g., add audio file)
export const useUpdateStoryRecording = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StoryRecording> }) => {
      console.log('Updating story recording:', id, updates);

      const { data, error } = await supabase
        .from('story_recordings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating story recording:', error);
        throw error;
      }

      return data as StoryRecording;
    },
    onSuccess: (data) => {
      console.log('Story recording updated successfully:', data.id);
      queryClient.invalidateQueries({ queryKey: ['story-recordings'] });
      toast({
        title: "Recording Updated",
        description: "Your story recording has been updated successfully!",
      });
    },
    onError: (error) => {
      console.error('Error updating story recording:', error);
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update story recording. Please try again.',
        variant: "destructive",
      });
    },
  });
};

// Hook to delete story recording
export const useDeleteStoryRecording = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting story recording:', id);

      const { error } = await supabase
        .from('story_recordings')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting story recording:', error);
        throw error;
      }

      return id;
    },
    onSuccess: (id) => {
      console.log('Story recording deleted successfully:', id);
      queryClient.invalidateQueries({ queryKey: ['story-recordings'] });
      toast({
        title: "Recording Deleted",
        description: "Story recording has been deleted successfully!",
      });
    },
    onError: (error) => {
      console.error('Error deleting story recording:', error);
      toast({
        title: "Delete Failed",
        description: error.message || 'Failed to delete story recording. Please try again.',
        variant: "destructive",
      });
    },
  });
};

// Audio recording utilities (reusing existing patterns)
export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

// Translation functionality
export interface TranslateStoryScriptParams {
  script_text: string;
  target_language: 'german' | 'spanish' | 'chinese' | 'swedish';
  story_type: 'childrens_story' | 'convincing_story';
}

export interface TranslationResult {
  translated_script: string;
  target_language: string;
  word_count: number;
}

export const useTranslateScript = () => {
  const { toast } = useToast();
  
  return useMutation<TranslationResult, Error, TranslateStoryScriptParams>({
    mutationFn: async ({ script_text, target_language, story_type }) => {
      const { data, error } = await supabase.functions.invoke('translate-story-script', {
        body: { script_text, target_language, story_type }
      });

      if (error) {
        console.error('Translation error:', error);
        throw new Error(error.message || 'Failed to translate script');
      }

      return data;
    },
    onError: (error) => {
      console.error('Translation failed:', error);
      toast({
        title: "Translation Failed",
        description: error.message || "Failed to translate the script. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Translation Complete",
        description: "Script has been successfully translated.",
      });
    },
  });
};

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(private onDataAvailable?: (chunk: Blob) => void) {}

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          if (this.onDataAvailable) {
            this.onDataAvailable(event.data);
          }
        }
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      throw error;
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        console.log('Audio recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}