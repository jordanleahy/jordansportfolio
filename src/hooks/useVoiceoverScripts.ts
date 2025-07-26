import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VoiceoverScript {
  id: string;
  user_id: string;
  source_id: string;
  source_type: 'blog_post' | 'social_media_post';
  original_content: string;
  generated_script: string;
  tone: string;
  style: string;
  word_count?: number;
  estimated_duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateVoiceoverScript {
  source_id: string;
  source_type: 'blog_post' | 'social_media_post';
  original_content: string;
  generated_script: string;
  tone: string;
  style: string;
  word_count?: number;
  estimated_duration_seconds?: number;
}

export const useVoiceoverScripts = (sourceId?: string) => {
  const query = useQuery({
    queryKey: ['voiceover-scripts', sourceId],
    queryFn: async () => {
      let query = supabase
        .from('voiceover_scripts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (sourceId) {
        query = query.eq('source_id', sourceId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as VoiceoverScript[];
    },
  });

  return query;
};

export const useGenerateVoiceoverScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content_type, source_text, tone, style }: {
      content_type: 'blog_post' | 'calendar_entry';
      source_text: string;
      tone: string;
      style: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('generate-voiceover-script', {
        body: { content_type, source_text, tone, style }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Voiceover script generated successfully!');
    },
    onError: (error) => {
      console.error('Error generating voiceover script:', error);
      toast.error('Failed to generate voiceover script. Please try again.');
    }
  });
};

export const useCreateVoiceoverScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (script: CreateVoiceoverScript) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('voiceover_scripts')
        .insert([{ ...script, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['voiceover-scripts'] });
      queryClient.invalidateQueries({ queryKey: ['voiceover-scripts', data.source_id] });
      toast.success('Voiceover script saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving voiceover script:', error);
      toast.error('Failed to save voiceover script. Please try again.');
    }
  });
};

export const useDeleteVoiceoverScript = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('voiceover_scripts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceover-scripts'] });
      toast.success('Voiceover script deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting voiceover script:', error);
      toast.error('Failed to delete voiceover script. Please try again.');
    }
  });
};