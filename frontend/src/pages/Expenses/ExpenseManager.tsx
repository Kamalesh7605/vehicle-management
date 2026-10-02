import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { DataTable, type Column } from '../../components/common/DataTable';
import { FilterSelect } from '../../components/common/FilterSelect';
import { DateFilterFields, ManagerToolbar } from '../../components/common/ManagerToolbar';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { useApi } from '../../hooks/useApi';
import { useDeleteAction } from '../../hooks/useDeleteAction';
import { useVehicleLookup } from '../../hooks/useLookups';
import { usePagedFilters } from '../../hooks/usePagedFilters';
import { expenseService } from '../../services/expenseService';
import type { Expense, ExpenseCategory } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_OPTIONS } from '../../utils/labels';
import { ExpenseFormDialog } from './ExpenseFormDialog';

interface Props {
  vehicleId?: number;
  embedded?: boolean;
  onChanged?: () => void;
}

export function ExpenseManager({ vehicleId, embedded = false, onChanged }: Props) {
  const { filters, setFilter, page, setPage, size, setSize } = usePagedFilters({ q: '', vehicleId: '', category: '', from: '', to: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const lookup = useVehicleLookup();

  const effectiveVehicleId = vehicleId ?? (filters.vehicleId ? Number(filters.vehicleId) : undefined);
  const list = useApi(
    () =>
      expenseService.list({
        q: filters.q,
        vehicleId: effectiveVehicleId,
        category: (filters.category || undefined) as ExpenseCategory | undefined,
        from: filters.from,
        to: filters.to,
        page,
        size,
      }),
    [filters.q, effectiveVehicleId, filters.category, filters.from, filters.to, page, size],
  );

  const changed = () => {
    list.reload();
    onChanged?.();
  };

  const { askDelete, dialog } = useDeleteAction<Expense>({
    title: 'Delete expense?',
    message: (e) => `Delete the ${EXPENSE_CATEGORY_LABELS[e.category]} expense of ${formatCurrency(e.amount)} for ${e.vehicleNumber}?`,
    remove: (e) => expenseService.remove(e.id),
    onDeleted: changed,
    successMessage: 'Expense deleted',
  });

  const openForm = (record: Expense | null) => {
    setEditing(record);
    setFormOpen(true);
  };

  const columns: Column<Expense>[] = [
    { key: 'date', header: 'Date', render: (e) => formatDate(e.date) },
    ...(embedded ? [] : [{ key: 'vehicle', header: 'Vehicle', render: (e: Expense) => <strong>{e.vehicleNumber}</strong> }]),
    { key: 'category', header: 'Category', render: (e) => EXPENSE_CATEGORY_LABELS[e.category] },
    { key: 'amount', header: 'Amount', align: 'right', render: (e) => <strong>{formatCurrency(e.amount)}</strong> },
    {
      key: 'description',
      header: 'Description',
      hideBelow: 'md',
      render: (e) => (
        <Typography variant="body2" noWrap sx={{ maxWidth: 260 }}>
          {e.description ?? '-'}
        </Typography>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (e) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton size="small" aria-label={`Edit expense ${formatDate(e.date)}`} onClick={() => openForm(e)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" aria-label={`Delete expense ${formatDate(e.date)}`} onClick={() => askDelete(e)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const addButton = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
      Add Expense
    </Button>
  );
  const filtered = !!(filters.q || filters.vehicleId || filters.category || filters.from || filters.to);

  return (
    <>
      {!embedded && <PageHeader title="Expenses" subtitle="Tolls, parking, allowances and other running costs" actions={addButton} />}
      <ManagerToolbar action={embedded ? addButton : undefined}>
        <SearchBar value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Search expenses..." />
        {!embedded && <FilterSelect label="Vehicle" value={filters.vehicleId} onChange={(v) => setFilter('vehicleId', v)} options={lookup.options} allLabel="All vehicles" />}
        <FilterSelect label="Category" value={filters.category} onChange={(v) => setFilter('category', v)} options={EXPENSE_CATEGORY_OPTIONS} allLabel="All categories" />
        <DateFilterFields from={filters.from} to={filters.to} onFrom={(v) => setFilter('from', v)} onTo={(v) => setFilter('to', v)} />
      </ManagerToolbar>

      <DataTable
        columns={columns}
        rows={list.data?.content ?? []}
        rowKey={(e) => e.id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        pagination={{ page, pageSize: size, total: list.data?.totalElements ?? 0, onPageChange: setPage, onPageSizeChange: setSize }}
        emptyTitle={filtered ? 'No matching expenses' : 'No expenses yet'}
        emptyMessage={filtered ? 'Try changing the search or filters.' : 'Add an expense to start tracking running costs.'}
        emptyActionLabel={filtered ? undefined : 'Add Expense'}
        onEmptyAction={() => openForm(null)}
      />

      <ExpenseFormDialog
        open={formOpen}
        record={editing}
        defaultVehicleId={vehicleId}
        vehicleOptions={lookup.options}
        onClose={() => setFormOpen(false)}
        onSaved={changed}
      />
      {dialog}
    </>
  );
}
