import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colorThemeService } from '@/services/colorThemeService';
import { ColorTheme, CreateColorTheme, UpdateColorTheme } from '@/types/colorTheme';
import { toast } from 'sonner';

export const useColorThemes = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['color-themes'],
    queryFn: () => colorThemeService.getAllColorThemes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Realtime updates are now handled by UnifiedRealtimeManager
  // Individual components should use useUnifiedRealtime for realtime functionality

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