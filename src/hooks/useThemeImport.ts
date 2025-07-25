import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { themeImportService } from '@/services/themeImportService';
import type { ValidationResult, ProcessingResult } from '@/types/themeImport';
import { useToast } from '@/hooks/use-toast';

export const useThemeImport = () => {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const previewMutation = useMutation({
    mutationFn: async (jsonData: string) => {
      const result = await themeImportService.previewImport(jsonData);
      setValidation(result);
      return result;
    },
    onError: (error) => {
      toast({
        title: "Preview failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const importMutation = useMutation({
    mutationFn: async (jsonData: string) => {
      return await themeImportService.importThemeData(jsonData);
    },
    onSuccess: (result: ProcessingResult) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
        queryClient.invalidateQueries({ queryKey: ['available-categories'] });
        toast({
          title: "Import successful",
          description: `Imported ${result.insertedCount} posts successfully`,
        });
      } else {
        toast({
          title: "Import failed",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      return await themeImportService.runCleanupAgent();
    },
    onSuccess: (result) => {
      if (result.errors.length === 0) {
        queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
        toast({
          title: "Cleanup completed",
          description: `Cleaned up ${result.cleaned} invalid posts`,
        });
      } else {
        toast({
          title: "Cleanup had issues",
          description: result.errors.join(', '),
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Cleanup failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  });

  const resetValidation = () => {
    setValidation(null);
  };

  return {
    validation,
    previewImport: previewMutation.mutate,
    importData: importMutation.mutate,
    runCleanup: cleanupMutation.mutate,
    resetValidation,
    isProcessing: previewMutation.isPending || importMutation.isPending || cleanupMutation.isPending,
    isPreviewLoading: previewMutation.isPending,
    isImportLoading: importMutation.isPending,
    isCleanupLoading: cleanupMutation.isPending
  };
};