import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ImageSeed, CreateImageSeedRequest, UpdateImageSeedRequest } from '@/types/imageSeeds';
import { toast } from 'sonner';

export const useImageSeeds = () => {
  const [seeds, setSeeds] = useState<ImageSeed[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeeds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('image_seeds')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSeeds(data || []);
    } catch (error) {
      console.error('Error fetching seeds:', error);
      toast.error('Failed to fetch seeds');
    } finally {
      setLoading(false);
    }
  };

  const createSeed = async (seedData: CreateImageSeedRequest) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // If setting as default, unset other defaults first
      if (seedData.is_default) {
        await supabase
          .from('image_seeds')
          .update({ is_default: false })
          .eq('category', seedData.category)
          .eq('is_default', true);
      }

      const { data, error } = await supabase
        .from('image_seeds')
        .insert([{ ...seedData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setSeeds(prev => [data, ...prev]);
      toast.success('Seed created successfully');
      return data;
    } catch (error) {
      console.error('Error creating seed:', error);
      toast.error('Failed to create seed');
      throw error;
    }
  };

  const updateSeed = async (id: string, updates: UpdateImageSeedRequest) => {
    try {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        const currentSeed = seeds.find(s => s.id === id);
        if (currentSeed) {
          await supabase
            .from('image_seeds')
            .update({ is_default: false })
            .eq('category', currentSeed.category)
            .eq('is_default', true)
            .neq('id', id);
        }
      }

      const { data, error } = await supabase
        .from('image_seeds')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setSeeds(prev => prev.map(seed => seed.id === id ? data : seed));
      toast.success('Seed updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating seed:', error);
      toast.error('Failed to update seed');
      throw error;
    }
  };

  const deleteSeed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('image_seeds')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSeeds(prev => prev.filter(seed => seed.id !== id));
      toast.success('Seed deleted successfully');
    } catch (error) {
      console.error('Error deleting seed:', error);
      toast.error('Failed to delete seed');
      throw error;
    }
  };

  const getDefaultSeed = (category: string) => {
    return seeds.find(seed => seed.category === category && seed.is_default);
  };

  const getSeedsByCategory = (category: string) => {
    return seeds.filter(seed => seed.category === category);
  };

  useEffect(() => {
    fetchSeeds();
  }, []);

  return {
    seeds,
    loading,
    createSeed,
    updateSeed,
    deleteSeed,
    getDefaultSeed,
    getSeedsByCategory,
    refetch: fetchSeeds
  };
};