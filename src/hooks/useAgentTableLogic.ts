import { useMemo } from 'react';
import { OpenAIAgent, AgentStatus } from '@/types/openaiAgent';

export type SortField = 'name' | 'status' | 'model_version' | 'owner' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

interface UseAgentFilteringProps {
  agents: OpenAIAgent[] | undefined;
  searchTerm: string;
  statusFilter: AgentStatus | 'all';
}

interface UseAgentSortingProps {
  agents: OpenAIAgent[];
  sortField: SortField;
  sortDirection: SortDirection;
}

interface UseFilteredAndSortedAgentsProps {
  agents: OpenAIAgent[] | undefined;
  searchTerm: string;
  statusFilter: AgentStatus | 'all';
  sortField: SortField;
  sortDirection: SortDirection;
}

/**
 * Custom hook for filtering agents based on search term and status
 */
export const useAgentFiltering = ({ agents, searchTerm, statusFilter }: UseAgentFilteringProps) => {
  return useMemo(() => {
    if (!agents) return [];

    return agents.filter((agent) => {
      // Search filtering
      const matchesSearch = searchTerm === '' || 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.owner.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filtering
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [agents, searchTerm, statusFilter]);
};

/**
 * Custom hook for sorting agents by specified field and direction
 */
export const useAgentSorting = ({ agents, sortField, sortDirection }: UseAgentSortingProps) => {
  return useMemo(() => {
    if (!agents || agents.length === 0) return [];

    const sortedAgents = [...agents];
    
    sortedAgents.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date fields
      if (sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } 
      // Handle string fields (case-insensitive sorting)
      else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Apply sort direction
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sortedAgents;
  }, [agents, sortField, sortDirection]);
};

/**
 * Combined hook that filters and sorts agents in one operation
 * More efficient than chaining multiple operations
 */
export const useFilteredAndSortedAgents = ({ 
  agents, 
  searchTerm, 
  statusFilter, 
  sortField, 
  sortDirection 
}: UseFilteredAndSortedAgentsProps) => {
  return useMemo(() => {
    if (!agents) return [];

    // Filter first
    const filtered = agents.filter((agent) => {
      const matchesSearch = searchTerm === '' || 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.owner.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Then sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [agents, searchTerm, statusFilter, sortField, sortDirection]);
};

/**
 * Hook for pagination logic
 */
export const useAgentPagination = (agents: OpenAIAgent[], pageSize: number, currentPage: number) => {
  return useMemo(() => {
    const totalPages = Math.ceil(agents.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedAgents = agents.slice(startIndex, endIndex);

    return {
      paginatedAgents,
      totalPages,
      totalCount: agents.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, agents.length),
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [agents, pageSize, currentPage]);
};