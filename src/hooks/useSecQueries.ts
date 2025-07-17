import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SecServiceOptimized } from "@/services/secServiceOptimized";
import type { OfferingFilters } from "@/types/sec";

// Query keys for consistent caching
export const secKeys = {
  all: ['sec'] as const,
  offerings: () => [...secKeys.all, 'offerings'] as const,
  offeringsList: (filters: OfferingFilters, page: number, pageSize: number) => 
    [...secKeys.offerings(), 'list', { filters, page, pageSize }] as const,
  offeringsDetail: (accessionnumber: string) => 
    [...secKeys.offerings(), 'detail', accessionnumber] as const,
  industries: () => [...secKeys.all, 'industries'] as const,
  summaryStats: () => [...secKeys.all, 'summaryStats'] as const,
};

// Hook for fetching paginated offerings with filters
export const useOfferings = (
  filters: OfferingFilters = {}, 
  page = 1, 
  pageSize = 50
) => {
  return useQuery({
    queryKey: secKeys.offeringsList(filters, page, pageSize),
    queryFn: () => SecServiceOptimized.getOfferings(filters, page, pageSize),
    staleTime: 1000 * 60 * 5, // 5 minutes for optimized queries
    retry: (failureCount, error: any) => {
      console.error(`Optimized query failed (attempt ${failureCount + 1}):`, error);
      return failureCount < 2; // Reduced retries for faster queries
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching single offering detail
export const useOfferingDetail = (accessionnumber: string | undefined) => {
  return useQuery({
    queryKey: secKeys.offeringsDetail(accessionnumber || ''),
    queryFn: () => SecServiceOptimized.getOfferingDetail(accessionnumber!),
    enabled: !!accessionnumber,
    staleTime: 1000 * 60 * 15, // 15 minutes for detail queries
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('not found')) {
        return false;
      }
      return failureCount < 1;
    },
  });
};

// Hook for fetching industries for filter dropdown
export const useIndustries = () => {
  return useQuery({
    queryKey: secKeys.industries(),
    queryFn: SecServiceOptimized.getIndustries,
    staleTime: 1000 * 60 * 60, // 1 hour (industries don't change often)
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching summary statistics
export const useSummaryStats = () => {
  return useQuery({
    queryKey: secKeys.summaryStats(),
    queryFn: SecServiceOptimized.getSummaryStats,
    staleTime: 1000 * 60 * 30, // 30 minutes cache for summary stats
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Hook for prefetching offering detail (useful for hover effects)
export const usePrefetchOfferingDetail = () => {
  const queryClient = useQueryClient();

  return (accessionnumber: string) => {
    queryClient.prefetchQuery({
      queryKey: secKeys.offeringsDetail(accessionnumber),
      queryFn: () => SecServiceOptimized.getOfferingDetail(accessionnumber),
      staleTime: 1000 * 60 * 15, // 15 minutes
    });
  };
};

// Hook for invalidating queries (useful after data imports)
export const useInvalidateSecQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: secKeys.all }),
    invalidateOfferings: () => queryClient.invalidateQueries({ queryKey: secKeys.offerings() }),
    invalidateIndustries: () => queryClient.invalidateQueries({ queryKey: secKeys.industries() }),
    invalidateSummaryStats: () => queryClient.invalidateQueries({ queryKey: secKeys.summaryStats() }),
  };
};