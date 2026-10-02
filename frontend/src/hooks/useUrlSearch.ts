import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Keeps a page's search text in the URL (?q=...) so the global search and links can pre-fill it. */
export function useUrlSearch(): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const setQ = useCallback(
    (value: string) => setParams(value ? { q: value } : {}, { replace: true }),
    [setParams],
  );
  return [q, setQ];
}
