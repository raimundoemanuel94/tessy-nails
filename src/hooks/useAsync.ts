/**
 * Hook para gerenciar state de requisições assíncronas
 * Reduz boilerplate e melhora tratamento de erros
 * 
 * Uso:
 * const { data, loading, error, execute, reset } = useAsync(
 *   () => fetchData(id),
 *   { immediate: true }
 * );
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseAsyncOptions {
  /** Executar função imediatamente ao montar */
  immediate?: boolean;
  /** Timeout em ms para requisição (0 = sem timeout) */
  timeout?: number;
  /** Callback ao sucesso */
  onSuccess?: (data: any) => void;
  /** Callback ao erro */
  onError?: (error: Error) => void;
}

/**
 * Hook para requisições assíncronas com estado automático
 * @param asyncFunction - Função async a executar
 * @param options - Opções de configuração
 * @returns Estado e funções de controle
 * 
 * @example
 * const { data, loading, error, execute, reset } = useAsync(
 *   async () => await api.getData(),
 *   { immediate: true }
 * );
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncState<T> & {
  execute: () => Promise<T | undefined>;
  reset: () => void;
} {
  const { immediate = true, timeout = 0, onSuccess, onError } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Usar ref para tracking de montagem (evita race conditions)
  const isMountedRef = useRef(true);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Função de execução com tratamento de erro
  const execute = useCallback(async (): Promise<T | undefined> => {
    if (!isMountedRef.current) return undefined;

    setState({ data: null, loading: true, error: null });

    try {
      // Setup timeout se configurado
      let timeoutPromise: Promise<never> | null = null;
      if (timeout > 0) {
        timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );
      }

      // Executar função com timeout opcional
      const resultPromise = asyncFunction();
      const result = timeoutPromise
        ? await Promise.race([resultPromise, timeoutPromise])
        : await resultPromise;

      // Verificar se componente ainda está montado
      if (!isMountedRef.current) return undefined;

      setState({ data: result, loading: false, error: null });
      onSuccess?.(result);

      return result;
    } catch (err) {
      // Verificar se componente ainda está montado
      if (!isMountedRef.current) return undefined;

      const error = err instanceof Error ? err : new Error('Unknown error');
      setState({ data: null, loading: false, error });
      onError?.(error);

      return undefined;
    }
  }, [asyncFunction, timeout, onSuccess, onError]);

  // Função para resetar state
  const reset = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setState({ data: null, loading: false, error: null });
  }, []);

  // Executar imediatamente se configurado
  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [execute, immediate]);

  return { ...state, execute, reset };
}

/**
 * Hook para requisições com retry automático
 */
export function useAsyncRetry<T>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions & { maxRetries?: number; retryDelay?: number } = {}
): UseAsyncState<T> & {
  execute: () => Promise<T | undefined>;
  retry: () => Promise<T | undefined>;
  reset: () => void;
} {
  const { maxRetries = 3, retryDelay = 1000, ...asyncOptions } = options;
  const retriesRef = useRef(0);

  const asyncState = useAsync(asyncFunction, {
    ...asyncOptions,
    immediate: false, // Não executar imediatamente
  });

  const executeWithRetry = useCallback(async (): Promise<T | undefined> => {
    try {
      retriesRef.current = 0;
      return await asyncState.execute();
    } catch (error) {
      return undefined;
    }
  }, [asyncState]);

  const retry = useCallback(async (): Promise<T | undefined> => {
    if (retriesRef.current >= maxRetries) {
      console.warn(`[useAsyncRetry] Máximo de tentativas (${maxRetries}) atingido`);
      return undefined;
    }

    retriesRef.current++;
    console.log(`[useAsyncRetry] Tentativa ${retriesRef.current}/${maxRetries}`);

    // Aguardar antes de retry
    await new Promise(resolve => setTimeout(resolve, retryDelay));

    return await asyncState.execute();
  }, [asyncState, maxRetries, retryDelay]);

  const reset = useCallback(() => {
    retriesRef.current = 0;
    asyncState.reset();
  }, [asyncState]);

  // Auto-executar na montagem
  useEffect(() => {
    executeWithRetry();
  }, [executeWithRetry]);

  return {
    ...asyncState,
    execute: executeWithRetry,
    retry,
    reset,
  };
}
