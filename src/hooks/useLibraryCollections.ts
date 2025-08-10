import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SharedCollection = Database["public"]["Tables"]["shared_collections"]["Row"];

interface UseLibraryCollectionsOptions {
  enabled?: boolean;
}

export const useLibraryCollections = (options: UseLibraryCollectionsOptions = {}) => {
  return useQuery({
    queryKey: ["libraryCollections"],
    queryFn: async (): Promise<SharedCollection[]> => {
      const { data, error } = await supabase
        .from("shared_collections")
        .select("*")
        .eq("include_in_library", true)
        .eq("status", "published")
        .order("featured", { ascending: false })
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: options.enabled !== false,
  });
};
