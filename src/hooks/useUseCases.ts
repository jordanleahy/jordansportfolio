import { useEntityActionsWrapper } from './useEntityActionsWrapper';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UseCase, CreateUseCase, UpdateUseCase, UseCaseFilters } from '@/types/useCases';

const useUseCaseEntityConfig = () => ({
  tableName: 'use_cases' as const,
  queryKey: ['use_cases'] as const,
  entityName: 'use case',
  successMessages: {
    create: 'Use case created successfully',
    update: 'Use case updated successfully', 
    delete: 'Use case deleted successfully'
  },
  invalidateQueries: (entity?: UseCase) => [['use_cases']]
});

export const useUseCases = (filters?: UseCaseFilters) => {
  return useQuery({
    queryKey: ['use_cases', filters],
    queryFn: async () => {
      let query = supabase
        .from('use_cases')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }

      if (filters?.complexity) {
        query = query.eq('complexity', filters.complexity);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as UseCase[];
    },
  });
};

export const useUseCase = (id: string) => {
  return useQuery({
    queryKey: ['use_cases', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('use_cases')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as UseCase;
    },
    enabled: !!id,
  });
};

export const useUseCaseActions = () => {
  return useEntityActionsWrapper<UseCase, CreateUseCase>(useUseCaseEntityConfig());
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['use_cases_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('use_cases')
        .select('category')
        .not('category', 'is', null);
      
      if (error) throw error;
      
      const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
      return categories.sort();
    },
  });
};

export const useIndustries = () => {
  return useQuery({
    queryKey: ['use_cases_industries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('use_cases')
        .select('industry')
        .not('industry', 'is', null);
      
      if (error) throw error;
      
      const industries = [...new Set(data.map(item => item.industry).filter(Boolean))];
      return industries.sort();
    },
  });
};