import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Character {
  id: string;
  user_id: string;
  character_name: string | null;
  image_hash: string;
  character_description: string;
  original_image_url: string;
  style: string;
  sample_image_url: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterGeneration {
  id: string;
  character_id: string;
  user_id: string;
  user_prompt: string;
  enhanced_prompt: string;
  generated_image_url: string;
  style: string;
  created_at: string;
}

// Hook to fetch user's characters
export const useCharacters = () => {
  return useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Character[];
    },
  });
};

// Hook to fetch a single character with its generations
export const useCharacter = (characterId: string | null) => {
  return useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      if (!characterId) return null;
      
      const { data: character, error: characterError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();
      
      if (characterError) throw characterError;
      
      const { data: generations, error: generationsError } = await supabase
        .from('character_generations')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: false });
      
      if (generationsError) throw generationsError;
      
      return {
        character: character as Character,
        generations: generations as CharacterGeneration[]
      };
    },
    enabled: !!characterId,
  });
};

// Hook to update character name
export const useUpdateCharacter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, character_name }: { id: string; character_name: string }) => {
      const { data, error } = await supabase
        .from('characters')
        .update({ character_name })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['character', data.id] });
      toast.success('Character name updated');
    },
    onError: (error) => {
      console.error('Error updating character:', error);
      toast.error('Failed to update character name');
    },
  });
};

// Hook to delete character
export const useDeleteCharacter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (characterId: string) => {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);
      
      if (error) throw error;
      return characterId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success('Character deleted');
    },
    onError: (error) => {
      console.error('Error deleting character:', error);
      toast.error('Failed to delete character');
    },
  });
};