import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Hide this column below the given breakpoint to keep tables readable on small screens. */
  hideBelow?: 'sm' | 'md' | 'lg';
  width?: number | string;
}

export interface ServerPagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  /** Provide for server-side pagination; otherwise rows are paged in the browser. */
  pagination?: ServerPagination;
  onRowClick?: (row: T) => void;
  /** Set false for compact tables (dashboard) that show all rows without a pager. */
  paginate?: boolean;
  elevated?: boolean;
  /** Compact rows for small dashboard cards: smaller text and padding, no wrapping. */
  dense?: boolean;
}

const PAGE_SIZES = [10, 25, 50];

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  pagination,
  onRowClick,
  paginate = true,
  elevated = true,
  dense = false,
}: Props<T>) {
  const [clientPage, setClientPage] = useState(0);
  const [clientSize, setClientSize] = useState(10);

  useEffect(() => {
    if (!pagination) setClientPage(0);
  }, [rows.length, pagination]);

  const visible = pagination || !paginate ? rows : rows.slice(clientPage * clientSize, (clientPage + 1) * clientSize);

  let body: ReactNode;
  if (error && rows.length === 0) {
    body = <ErrorState message={error} onRetry={onRetry} />;
  } else if (loading && rows.length === 0) {
    body = <LoadingState />;
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  } else {
    body = (
      <TableContainer sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity .15s' }}>
        <Table
          size={dense ? 'small' : 'medium'}
          sx={dense ? { '& th, & td': { px: 1, py: 1, fontSize: 12.5, whiteSpace: 'nowrap' } } : undefined}
        >
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  align={c.align}
                  sx={{ width: c.width, display: c.hideBelow ? { xs: 'none', [c.hideBelow]: 'table-cell' } : undefined }}
                >
                  {c.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((row) => (
              <TableRow
                key={rowKey(row)}
                hover
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:last-child td': { borderBottom: 0 } }}
              >
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    align={c.align}
                    sx={{ display: c.hideBelow ? { xs: 'none', [c.hideBelow]: 'table-cell' } : undefined }}
                  >
                    {c.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  const showPager = paginate && rows.length > 0 && (pagination ? pagination.total > 0 : rows.length > PAGE_SIZES[0]);

  return (
    <Paper
      variant={elevated ? 'outlined' : 'elevation'}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: elevated ? '0 1px 3px rgba(15,23,42,.05)' : 'none',
        border: elevated ? undefined : 0,
      }}
    >
      {body}
      {showPager && (
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <TablePagination
            component="div"
            rowsPerPageOptions={PAGE_SIZES}
            count={pagination ? pagination.total : rows.length}
            page={pagination ? pagination.page : clientPage}
            rowsPerPage={pagination ? pagination.pageSize : clientSize}
            onPageChange={(_, p) => (pagination ? pagination.onPageChange(p) : setClientPage(p))}
            onRowsPerPageChange={(e) => {
              const size = Number(e.target.value);
              if (pagination) pagination.onPageSizeChange(size);
              else {
                setClientSize(size);
                setClientPage(0);
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
}
