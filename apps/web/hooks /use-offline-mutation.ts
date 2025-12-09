import { useState } from 'react';
import { indexedDB } from '../lib/offline/indexed-db';
import { useSyncStore } from '../lib/stores/use-sync-store';

type MutationFn<TData, TVariables> = (variables: TVariables) => Promise<TData>;

interface UseOfflineMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

interface OfflineMutation<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<void>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: TData | null;
}

export function useOfflineMutation<TData = unknown, TVariables = unknown>(
  mutationFn: MutationFn<TData, TVariables>,
  options?: UseOfflineMutationOptions<TData, TVariables>
): OfflineMutation<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);
  
  const { isOnline, incrementPendingChanges, startSync } = useSyncStore();

  const mutateAsync = async (variables: TVariables): Promise<TData> => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      if (isOnline) {
        // Online: execute immediately
        const result = await mutationFn(variables);
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } else {
        // Offline: queue for later sync
        incrementPendingChanges();
        
        // Return optimistic response
        const optimisticResult = {} as TData;
        setData(optimisticResult);
        options?.onSuccess?.(optimisticResult);
        return optimisticResult;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setIsError(true);
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
      options?.onSettled?.();
    }
  };

  const mutate = async (variables: TVariables): Promise<void> => {
    await mutateAsync(variables);
  };

  return {
    mutate,
    mutateAsync,
    isLoading,
    isError,
    error,
    data,
  };
}