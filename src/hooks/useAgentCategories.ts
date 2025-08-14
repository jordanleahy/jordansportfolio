import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgentCategory {
  id: string;
  category_key: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Fetch all active agent categories
export const useAgentCategories = () => {
  return useQuery({
    queryKey: ['agent-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as AgentCategory[];
    },
  });
};

// Get category options for forms (category_key as value, display_name as label)
export const useCategoryOptions = () => {
  const { data: categories, ...rest } = useAgentCategories();
  
  const categoryOptions = categories?.map(category => ({
    value: category.category_key,
    label: category.display_name,
    description: category.description,
  })) || [];

  return {
    data: categoryOptions,
    ...rest,
  };
};