import { useCallback, useState } from 'react';

/** Filter values + server pagination state; changing any filter jumps back to the first page. */
export function usePagedFilters<F extends Record<string, string>>(initial: F) {
  const [filters, setFilters] = useState<F>(initial);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
  }, []);

  const changeSize = useCallback((next: number) => {
    setSize(next);
    setPage(0);
  }, []);

  return { filters, setFilter, page, setPage, size, setSize: changeSize };
}
