import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DuplicateCollectionRequest {
  theme_id: string;
}

interface DuplicateCollectionResponse {
  success: boolean;
  theme: {
    id: string;
    theme_name: string;
    description: string | null;
    category: string;
  };
  duplicatedPosts: number;
  message: string;
}

export const useDuplicatePublicCollection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation<DuplicateCollectionResponse, Error, DuplicateCollectionRequest>({
    mutationFn: async ({ theme_id }) => {
      const { data, error } = await supabase.functions.invoke('duplicate-public-collection', {
        body: { theme_id }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Collection Saved!",
        description: data.message,
      });
      
      // Invalidate queries to refresh user's themes and collections
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      queryClient.invalidateQueries({ queryKey: ["libraryCollections"] });
      queryClient.invalidateQueries({ queryKey: ["availableThemes"] });
      queryClient.invalidateQueries({ queryKey: ["shared_collections"] });
      
      // Force refetch of current collection data
      window.location.reload();
    },
    onError: (error) => {
      console.error("Duplication failed:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save collection. Please try again.",
        variant: "destructive",
      });
    },
  });
};