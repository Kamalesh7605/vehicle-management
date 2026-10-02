import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { getErrorMessage } from '../services/api';

export interface ApiState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Runs `fetcher` whenever `deps` change (or reload() is called) and tracks loading / error state. */
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList): ApiState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(getErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
