import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FetchLogosParams {
  vendor_id?: string;
  vendor_ids?: string[];
  force?: boolean;
}

interface LogoFetchResult {
  vendor_id: string;
  company_name: string;
  social_logo_url: string | null;
  landscape_logo_url: string | null;
  source: 'clearbit' | 'website' | 'failed';
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

interface FetchLogosResponse {
  results: LogoFetchResult[];
}

export function useFetchVendorLogos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendor_id, vendor_ids, force = false }: FetchLogosParams) => {
      const { data, error } = await supabase.functions.invoke<FetchLogosResponse>(
        'fetch-vendor-logos',
        {
          body: { vendor_id, vendor_ids, force },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (!data?.results) return;

      const successCount = data.results.filter(r => r.status === 'success').length;
      const partialCount = data.results.filter(r => r.status === 'partial').length;
      const failedCount = data.results.filter(r => r.status === 'failed').length;

      let description = '';
      if (successCount > 0) description += `${successCount} succeeded`;
      if (partialCount > 0) description += `${description ? ', ' : ''}${partialCount} partial`;
      if (failedCount > 0) description += `${description ? ', ' : ''}${failedCount} failed`;

      toast({
        title: successCount > 0 ? 'Logos fetched!' : 'Logo fetch completed',
        description,
        variant: successCount > 0 ? 'default' : 'destructive',
      });

      // Invalidate vendor queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to fetch logos',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
