import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EntityConfig<TEntity, TInput> {
  tableName: string;
  queryKey: QueryKey;
  entityName: string;
  requiresAuth?: boolean;
  transformInput?: (input: TInput) => any;
  transformOutput?: (data: any) => TEntity;
  onSuccessMessage?: {
    create?: string;
    update?: string;
    delete?: string;
  };
  invalidateQueries?: (entity?: TEntity) => QueryKey[];
}

export interface CreateInput<TInput> {
  data: TInput;
}

export interface UpdateInput<TInput> {
  id: string;
  data: Partial<TInput>;
}

/**
 * Generic CRUD operations hook for any entity
 * Provides consistent error handling, toast messages, and query invalidation
 */
export const useEntityActions = <TEntity, TInput>(
  config: EntityConfig<TEntity, TInput>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const {
    tableName,
    queryKey,
    entityName,
    requiresAuth = true,
    transformInput,
    transformOutput,
    onSuccessMessage = {},
    invalidateQueries
  } = config;

  const defaultMessages = {
    create: `${entityName} created successfully`,
    update: `${entityName} updated successfully`,
    delete: `${entityName} deleted successfully`,
  };

  const successMessages = {
    ...defaultMessages,
    ...onSuccessMessage,
  };

  const getUser = async () => {
    if (!requiresAuth) return null;
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error("User not authenticated");
    }
    return user;
  };

  const invalidateEntityQueries = (entity?: TEntity) => {
    const baseQueries = [queryKey];
    const additionalQueries = invalidateQueries ? invalidateQueries(entity) : [];
    
    [...baseQueries, ...additionalQueries].forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };

  const create = useMutation({
    mutationFn: async ({ data }: CreateInput<TInput>) => {
      const user = await getUser();
      
      let inputData = transformInput ? transformInput(data) : data;
      
      // Add user_id if authentication is required
      if (requiresAuth && user) {
        inputData = { ...inputData, user_id: user.id };
      }

      const { data: result, error } = await supabase
        .from(tableName as any)
        .insert([inputData])
        .select()
        .single();

      if (error) throw error;
      
      return transformOutput ? transformOutput(result) : result as TEntity;
    },
    onSuccess: (entity) => {
      invalidateEntityQueries(entity);
      toast({
        title: "Success",
        description: successMessages.create,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create ${entityName.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
      console.error(`Create ${entityName} error:`, error);
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: UpdateInput<TInput>) => {
      const inputData = transformInput ? transformInput(data as TInput) : data;

      const { data: result, error } = await supabase
        .from(tableName as any)
        .update(inputData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      return transformOutput ? transformOutput(result) : result as TEntity;
    },
    onSuccess: (entity) => {
      invalidateEntityQueries(entity);
      toast({
        title: "Success",
        description: successMessages.update,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update ${entityName.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
      console.error(`Update ${entityName} error:`, error);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      invalidateEntityQueries();
      toast({
        title: "Success",
        description: successMessages.delete,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete ${entityName.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
      console.error(`Delete ${entityName} error:`, error);
    },
  });

  return {
    create,
    update,
    delete: remove,
  };
};