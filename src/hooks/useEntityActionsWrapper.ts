import { useEntityActions, EntityConfig } from './useEntityActions';

export interface EntityActionsWrapper<TEntity, TInput> {
  create: {
    mutate: (data: TInput, options?: any) => void;
    mutateAsync: (data: TInput) => Promise<TEntity>;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    reset: () => void;
  };
  update: {
    mutate: (input: { id: string } & Partial<TInput>, options?: any) => void;
    mutateAsync: (input: { id: string } & Partial<TInput>) => Promise<TEntity>;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    reset: () => void;
  };
  delete: {
    mutate: (id: string, options?: any) => void;
    mutateAsync: (id: string) => Promise<string>;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    reset: () => void;
  };
}

/**
 * Generic wrapper for entity actions that provides a consistent API
 * Eliminates the need for repetitive wrapper functions in entity hooks
 */
export const useEntityActionsWrapper = <TEntity, TInput>(
  config: EntityConfig<TEntity, TInput>
): EntityActionsWrapper<TEntity, TInput> => {
  const entityActions = useEntityActions<TEntity, TInput>(config);

  const create = {
    ...entityActions.create,
    mutate: (data: TInput, options?: any) => entityActions.create.mutate({ data }, options),
    mutateAsync: (data: TInput) => entityActions.create.mutateAsync({ data }),
  };

  const update = {
    ...entityActions.update,
    mutate: (input: { id: string } & Partial<TInput>, options?: any) => {
      const { id, ...data } = input;
      return entityActions.update.mutate({ id, data: data as Partial<TInput> }, options);
    },
    mutateAsync: (input: { id: string } & Partial<TInput>) => {
      const { id, ...data } = input;
      return entityActions.update.mutateAsync({ id, data: data as Partial<TInput> });
    },
  };

  const deleteAction = entityActions.delete;

  return {
    create,
    update,
    delete: deleteAction,
  };
};