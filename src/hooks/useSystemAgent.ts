import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OpenAIAgent } from '@/types/openaiAgent';

export const useSystemAgent = (agentName: string) => {
  return useQuery({
    queryKey: ['system-agent', agentName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('openai_agents')
        .select('*')
        .eq('name', agentName)
        .eq('status', 'active')
        .eq('owner', 'System')
        .single();

      if (error) {
        console.error(`System agent "${agentName}" not found:`, error);
        throw new Error(`System agent "${agentName}" is not available. Please contact support.`);
      }
      
      return data as OpenAIAgent;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes since system agents rarely change
  });
};