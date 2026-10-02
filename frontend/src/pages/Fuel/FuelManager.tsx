import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Button, IconButton, Stack, Tooltip } from '@mui/material';
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
import { fuelService } from '../../services/fuelService';
import type { FuelRecord } from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import { FUEL_TYPE_LABELS } from '../../utils/labels';
import { FuelFormDialog } from './FuelFormDialog';

interface Props {
  /** Lock the list to one vehicle (used on the vehicle details page). */
  vehicleId?: number;
  embedded?: boolean;
  onChanged?: () => void;
}

export function FuelManager({ vehicleId, embedded = false, onChanged }: Props) {
  const { filters, setFilter, page, setPage, size, setSize } = usePagedFilters({ q: '', vehicleId: '', from: '', to: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);
  const lookup = useVehicleLookup();

  const effectiveVehicleId = vehicleId ?? (filters.vehicleId ? Number(filters.vehicleId) : undefined);
  const list = useApi(
    () => fuelService.list({ q: filters.q, vehicleId: effectiveVehicleId, from: filters.from, to: filters.to, page, size }),
    [filters.q, effectiveVehicleId, filters.from, filters.to, page, size],
  );

  const changed = () => {
    list.reload();
    lookup.reload();
    onChanged?.();
  };

  const { askDelete, dialog } = useDeleteAction<FuelRecord>({
    title: 'Delete fuel record?',
    message: (r) => `Delete the ${formatDate(r.date)} fuel entry for ${r.vehicleNumber} (${formatCurrency(r.totalAmount)})?`,
    remove: (r) => fuelService.remove(r.id),
    onDeleted: changed,
    successMessage: 'Fuel record deleted',
  });

  const openForm = (record: FuelRecord | null) => {
    setEditing(record);
    setFormOpen(true);
  };

  const columns: Column<FuelRecord>[] = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
    ...(embedded ? [] : [{ key: 'vehicle', header: 'Vehicle', render: (r: FuelRecord) => <strong>{r.vehicleNumber}</strong> }]),
    { key: 'type', header: 'Fuel Type', hideBelow: 'md', render: (r) => (r.fuelType ? FUEL_TYPE_LABELS[r.fuelType] : '-') },
    { key: 'qty', header: 'Quantity', align: 'right', hideBelow: 'sm', render: (r) => `${formatNumber(r.quantity)} L` },
    { key: 'price', header: 'Price/Litre', align: 'right', hideBelow: 'md', render: (r) => formatCurrency(r.pricePerLitre) },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <strong>{formatCurrency(r.totalAmount)}</strong> },
    { key: 'odo', header: 'Odometer', align: 'right', hideBelow: 'lg', render: (r) => (r.odometer === null ? '-' : formatNumber(r.odometer)) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton size="small" aria-label={`Edit fuel entry ${formatDate(r.date)}`} onClick={() => openForm(r)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" aria-label={`Delete fuel entry ${formatDate(r.date)}`} onClick={() => askDelete(r)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const addButton = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
      Add Fuel Entry
    </Button>
  );
  const filtered = !!(filters.q || filters.vehicleId || filters.from || filters.to);

  return (
    <>
      {!embedded && <PageHeader title="Fuel Records" subtitle="Track fuel purchases and mileage" actions={addButton} />}
      <ManagerToolbar action={embedded ? addButton : undefined}>
        <SearchBar value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Search fuel records..." />
        {!embedded && <FilterSelect label="Vehicle" value={filters.vehicleId} onChange={(v) => setFilter('vehicleId', v)} options={lookup.options} allLabel="All vehicles" />}
        <DateFilterFields from={filters.from} to={filters.to} onFrom={(v) => setFilter('from', v)} onTo={(v) => setFilter('to', v)} />
      </ManagerToolbar>

      <DataTable
        columns={columns}
        rows={list.data?.content ?? []}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        pagination={{ page, pageSize: size, total: list.data?.totalElements ?? 0, onPageChange: setPage, onPageSizeChange: setSize }}
        emptyTitle={filtered ? 'No matching fuel records' : 'No fuel records yet'}
        emptyMessage={filtered ? 'Try changing the search or filters.' : 'Add a fuel entry to start tracking costs and mileage.'}
        emptyActionLabel={filtered ? undefined : 'Add Fuel Entry'}
        onEmptyAction={() => openForm(null)}
      />

      <FuelFormDialog
        open={formOpen}
        record={editing}
        defaultVehicleId={vehicleId}
        vehicles={lookup.vehicles}
        vehicleOptions={lookup.options}
        onClose={() => setFormOpen(false)}
        onSaved={changed}
      />
      {dialog}
    </>
  );
}
