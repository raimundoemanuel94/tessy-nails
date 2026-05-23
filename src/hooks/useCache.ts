/**
 * Hook para cache de dados com SWR pattern
 * Implementa cache automático, revalidação e refresh
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CacheOptions {
  ttl?: number; // Time to live em ms (default: 5 min)
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  error?: Error;
}

/**
 * Hook simples de cache (alternativa a React Query)
 * Ideal para dados que mudam pouco
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, onError, onSuccess } = options;
  const cacheRef = useRef<CacheEntry<T> | null>(null);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isStale = useCallback(() => {
    if (!cacheRef.current) return true;
    const age = Date.now() - cacheRef.current.timestamp;
    return age > ttl;
  }, [ttl]);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcher();
      cacheRef.current = { data: result, timestamp: Date.now() };
      setData(result);
      setError(null);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, onError, onSuccess]);

  // Carregar na montagem se cache está vazio ou stale
  useEffect(() => {
    if (!cacheRef.current || isStale()) {
      void fetch();
    } else {
      setData(cacheRef.current.data);
      setLoading(false);
    }
  }, [fetch, isStale, key]);

  const refresh = useCallback(() => {
    void fetch();
  }, [fetch]);

  return { data, loading, error, refresh, isStale: isStale() };
}

/**
 * Hook para cache com deduplicação
 * Se múltiplos componentes usam a mesma chave, compartilham o request
 */
const globalCache = new Map<string, {
  promise: Promise<any>;
  data: any;
  timestamp: number;
  subscribers: Set<(data: any) => void>;
}>();

export function useCacheDedup<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, onError, onSuccess } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const cache = globalCache.get(key);
    const isStale = !cache || Date.now() - cache.timestamp > ttl;

    if (cache && !isStale) {
      // Cache ainda é válido
      setData(cache.data);
      setLoading(false);
      return;
    }

    if (cache && cache.promise) {
      // Request já em progresso, reutilizar
      setLoading(true);
      cache.promise
        .then((result) => {
          setData(result);
          onSuccess?.(result);
        })
        .catch((err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          onError?.(error);
        })
        .finally(() => setLoading(false));
      return;
    }

    // Novo request
    setLoading(true);
    const promise = fetcher();

    globalCache.set(key, {
      promise,
      data: null,
      timestamp: Date.now(),
      subscribers: new Set([setData]),
    });

    promise
      .then((result) => {
        const cacheEntry = globalCache.get(key);
        if (cacheEntry) {
          cacheEntry.data = result;
          cacheEntry.subscribers.forEach((subscriber) => subscriber(result));
        }
        setData(result);
        onSuccess?.(result);
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      })
      .finally(() => setLoading(false));
  }, [key, fetcher, ttl, onError, onSuccess]);

  const refresh = useCallback(() => {
    globalCache.delete(key);
  }, [key]);

  return { data, loading, error, refresh };
}

/**
 * Limpar cache global
 */
export function clearGlobalCache(pattern?: string) {
  if (!pattern) {
    globalCache.clear();
    return;
  }

  for (const key of globalCache.keys()) {
    if (key.includes(pattern)) {
      globalCache.delete(key);
    }
  }
}

/**
 * Hook para lista com paginação e cache
 */
export interface PaginatedCacheOptions extends CacheOptions {
  pageSize?: number;
}

export function usePaginatedCache<T>(
  key: string,
  fetcher: (page: number, pageSize: number) => Promise<T[]>,
  options: PaginatedCacheOptions = {}
) {
  const { pageSize = 10 } = options;
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);

  const { data, loading, error, refresh } = useCache(
    `${key}:${page}`,
    () => fetcher(page, pageSize),
    options
  );

  useEffect(() => {
    if (data) {
      if (page === 1) {
        setAllData(data);
      } else {
        setAllData((prev) => [...prev, ...data]);
      }
    }
  }, [data, page]);

  const nextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const resetPagination = useCallback(() => {
    setPage(1);
    setAllData([]);
    refresh();
  }, [refresh]);

  return {
    data: allData,
    currentPage: page,
    loading,
    error,
    hasMore: data ? data.length === pageSize : false,
    nextPage,
    refresh: resetPagination,
  };
}
