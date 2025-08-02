import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { colorThemeService } from '@/services/colorThemeService';
import { ColorTheme, CreateColorTheme, UpdateColorTheme } from '@/types/colorTheme';
import { toast } from 'sonner';
import { realtimeEventBus } from '@/services/realtime/RealtimeEventBus';

export const useColorThemes = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['color-themes'],
    queryFn: () => colorThemeService.getAllColorThemes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    const channel = supabase
      .channel('color-themes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'color_themes'
        },
        (payload) => {
          console.log('🎨 [ColorThemes] Real-time update received:', payload);
          
          // Emit generic event
          realtimeEventBus.emit({
            type: 'update-received',
            payload: {
              table: 'color_themes',
              eventType: payload.eventType,
              data: payload.new || payload.old,
              timestamp: Date.now()
            }
          });

          // Emit specific color theme event
          let action: 'created' | 'updated' | 'deleted';
          if (payload.eventType === 'INSERT') {
            action = 'created';
          } else if (payload.eventType === 'UPDATE') {
            action = 'updated';
          } else {
            action = 'deleted';
          }

          realtimeEventBus.emit({
            type: 'color-theme-changed',
            payload: {
              action,
              theme: payload.new || payload.old,
              timestamp: Date.now()
            }
          });
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['color-themes'] });
          queryClient.invalidateQueries({ queryKey: ['color-theme'] });
          
          // Clear service cache
          colorThemeService.invalidateCache();
          
          // Show toast notifications
          if (payload.eventType === 'INSERT') {
            toast.success('New color theme created');
          } else if (payload.eventType === 'UPDATE') {
            toast.success('Color theme updated');
          } else if (payload.eventType === 'DELETE') {
            toast.success('Color theme deleted');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useColorTheme = (id: string) => {
  return useQuery({
    queryKey: ['color-theme', id],
    queryFn: () => colorThemeService.getColorThemeById(id),
    enabled: !!id,
  });
};

export const useDefaultColorTheme = () => {
  return useQuery({
    queryKey: ['color-theme', 'default'],
    queryFn: () => colorThemeService.getDefaultColorTheme(),
  });
};

export const useCreateColorTheme = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (theme: CreateColorTheme) => colorThemeService.createColorTheme(theme),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['color-themes'] });
      toast.success('Color theme created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create color theme: ${error.message}`);
    },
  });
};

export const useUpdateColorTheme = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (theme: UpdateColorTheme) => colorThemeService.updateColorTheme(theme),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['color-themes'] });
      queryClient.invalidateQueries({ queryKey: ['color-theme'] });
      toast.success('Color theme updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update color theme: ${error.message}`);
    },
  });
};

export const useDeleteColorTheme = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => colorThemeService.deleteColorTheme(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['color-themes'] });
      toast.success('Color theme deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete color theme: ${error.message}`);
    },
  });
};

export const useDuplicateColorTheme = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => 
      colorThemeService.duplicateColorTheme(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['color-themes'] });
      toast.success('Color theme duplicated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to duplicate color theme: ${error.message}`);
    },
  });
};