import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SharedCollection } from "@/hooks/useLibraryCollections";

export const useFeaturedCollections = () => {
  return useQuery({
    queryKey: ["featuredCollections"],
    queryFn: async (): Promise<SharedCollection[]> => {
      const { data, error } = await supabase
        .from("shared_collections")
        .select("*, cover_image_url")
        .eq("featured", true)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};