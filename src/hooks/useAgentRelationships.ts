import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AgentRelationship, CreateAgentRelationshipData, UpdateAgentRelationshipData, AgentDependency } from '@/types/agentRelationship';
import { OpenAIAgent } from '@/types/openaiAgent';
import { useOpenAIAgents } from './useOpenAIAgents';
import { toast } from 'sonner';

// Fetch all relationships for the current user's agents
export const useAgentRelationships = () => {
  return useQuery({
    queryKey: ['agent-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_relationships')
        .select(`
          *,
          source_agent:openai_agents!source_agent_id(id, name),
          target_agent:openai_agents!target_agent_id(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data as (AgentRelationship & {
        source_agent: { id: string; name: string };
        target_agent: { id: string; name: string };
      })[];
    },
  });
};

// Fetch dependencies for a specific agent
export const useAgentDependencies = (agentId: string) => {
  return useQuery({
    queryKey: ['agent-dependencies', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_agent_dependencies', { p_agent_id: agentId });

      if (error) throw error;
      
      return data as AgentDependency[];
    },
    enabled: !!agentId,
  });
};

// Create a new agent relationship
export const useCreateAgentRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAgentRelationshipData) => {
      // Check for circular dependencies first
      const { data: hasCycle, error: cycleError } = await supabase
        .rpc('detect_dependency_cycle', {
          p_source_agent_id: data.source_agent_id,
          p_target_agent_id: data.target_agent_id
        });

      if (cycleError) throw cycleError;
      
      if (hasCycle) {
        throw new Error('This relationship would create a circular dependency');
      }

      const { data: relationship, error } = await supabase
        .from('agent_relationships')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      return relationship as AgentRelationship;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-relationships'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
      toast.success('Agent relationship created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create relationship: ${error.message}`);
    },
  });
};

// Update an agent relationship
export const useUpdateAgentRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateAgentRelationshipData) => {
      const { data: relationship, error } = await supabase
        .from('agent_relationships')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return relationship as AgentRelationship;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-relationships'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
      toast.success('Agent relationship updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update relationship: ${error.message}`);
    },
  });
};

// Delete an agent relationship
export const useDeleteAgentRelationship = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agent_relationships')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-relationships'] });
      queryClient.invalidateQueries({ queryKey: ['agent-dependencies'] });
      queryClient.invalidateQueries({ queryKey: ['openai-agents'] });
      toast.success('Agent relationship deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete relationship: ${error.message}`);
    },
  });
};

// Get agents with their relationship information
export const useAgentsWithRelationships = () => {
  const { data: agents } = useOpenAIAgents();

  const { data: relationships } = useAgentRelationships();

  return useQuery({
    queryKey: ['agents-with-relationships', agents?.length, relationships?.length],
    queryFn: async () => {
      if (!agents || !relationships) return [];

      // Create maps for efficient lookups
      const dependencyMap = new Map<string, AgentDependency[]>();
      const dependentMap = new Map<string, AgentDependency[]>();

      // Process relationships to build dependency maps
      for (const rel of relationships) {
        const dependency: AgentDependency = {
          agent_id: rel.target_agent.id,
          agent_name: rel.target_agent.name,
          relationship_type: rel.relationship_type,
          depth: 1,
          is_required: rel.is_required
        };

        const dependent: AgentDependency = {
          agent_id: rel.source_agent.id,
          agent_name: rel.source_agent.name,
          relationship_type: rel.relationship_type,
          depth: 1,
          is_required: rel.is_required
        };

        // Add to dependency map (what this agent depends on)
        if (!dependencyMap.has(rel.source_agent.id)) {
          dependencyMap.set(rel.source_agent.id, []);
        }
        dependencyMap.get(rel.source_agent.id)!.push(dependency);

        // Add to dependent map (what depends on this agent)
        if (!dependentMap.has(rel.target_agent.id)) {
          dependentMap.set(rel.target_agent.id, []);
        }
        dependentMap.get(rel.target_agent.id)!.push(dependent);
      }

      // Enhance agents with relationship data
      return agents.map(agent => {
        const dependencies = dependencyMap.get(agent.id) || [];
        const dependents = dependentMap.get(agent.id) || [];
        
        // Determine dependency status
        let dependency_status: 'ready' | 'blocked' | 'unknown' = 'ready';
        const blocked_by: string[] = [];

        for (const dep of dependencies) {
          if (dep.is_required) {
            const depAgent = agents.find(a => a.id === dep.agent_id);
            if (depAgent?.status !== 'active') {
              dependency_status = 'blocked';
              blocked_by.push(dep.agent_name);
            }
          }
        }

        if (dependencies.length === 0) {
          dependency_status = 'ready';
        } else if (blocked_by.length === 0) {
          dependency_status = 'ready';
        }

        return {
          ...agent,
          dependencies,
          dependents,
          blocked_by,
          dependency_status
        };
      });
    },
    enabled: !!agents && !!relationships,
  });
};