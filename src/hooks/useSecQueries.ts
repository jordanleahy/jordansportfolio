import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SecService } from "@/services/secService";
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
    queryFn: () => SecService.getOfferings(filters, page, pageSize),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching single offering detail
export const useOfferingDetail = (accessionnumber: string | undefined) => {
  return useQuery({
    queryKey: secKeys.offeringsDetail(accessionnumber || ''),
    queryFn: () => SecService.getOfferingDetail(accessionnumber!),
    enabled: !!accessionnumber,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors
      if (error?.message?.includes('not found')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Hook for fetching industries for filter dropdown
export const useIndustries = () => {
  return useQuery({
    queryKey: secKeys.industries(),
    queryFn: SecService.getIndustries,
    staleTime: 1000 * 60 * 30, // 30 minutes (industries don't change often)
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for fetching summary statistics
export const useSummaryStats = () => {
  return useQuery({
    queryKey: secKeys.summaryStats(),
    queryFn: SecService.getSummaryStats,
    staleTime: 0, // No caching - data only changes quarterly
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for prefetching offering detail (useful for hover effects)
export const usePrefetchOfferingDetail = () => {
  const queryClient = useQueryClient();

  return (accessionnumber: string) => {
    queryClient.prefetchQuery({
      queryKey: secKeys.offeringsDetail(accessionnumber),
      queryFn: () => SecService.getOfferingDetail(accessionnumber),
      staleTime: 1000 * 60 * 10, // 10 minutes
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