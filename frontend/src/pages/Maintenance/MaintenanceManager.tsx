import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
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
import { maintenanceService } from '../../services/maintenanceService';
import type { MaintenanceRecord, MaintenanceType } from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import { MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_OPTIONS } from '../../utils/labels';
import { MaintenanceFormDialog } from './MaintenanceFormDialog';

const DUE_SOON_KM = 1000;

function RemainingCell({ record }: { record: MaintenanceRecord }) {
  if (record.remainingKm === null) return <>-</>;
  const overdue = record.remainingKm <= 0;
  return (
    <Stack alignItems="flex-end" spacing={0.25}>
      <Chip
        size="small"
        color={overdue ? 'error' : record.remainingKm <= DUE_SOON_KM ? 'warning' : 'success'}
        label={overdue ? `Overdue ${formatNumber(-record.remainingKm)} KM` : `${formatNumber(record.remainingKm)} KM`}
      />
      <Typography variant="caption" color="text.secondary">
        Current {formatNumber(record.currentKm)} KM
      </Typography>
    </Stack>
  );
}

interface Props {
  vehicleId?: number;
  embedded?: boolean;
  onChanged?: () => void;
}

export function MaintenanceManager({ vehicleId, embedded = false, onChanged }: Props) {
  const { filters, setFilter, page, setPage, size, setSize } = usePagedFilters({ q: '', vehicleId: '', type: '', from: '', to: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const lookup = useVehicleLookup();

  const effectiveVehicleId = vehicleId ?? (filters.vehicleId ? Number(filters.vehicleId) : undefined);
  const list = useApi(
    () =>
      maintenanceService.list({
        q: filters.q,
        vehicleId: effectiveVehicleId,
        type: (filters.type || undefined) as MaintenanceType | undefined,
        from: filters.from,
        to: filters.to,
        page,
        size,
      }),
    [filters.q, effectiveVehicleId, filters.type, filters.from, filters.to, page, size],
  );

  const changed = () => {
    list.reload();
    lookup.reload();
    onChanged?.();
  };

  const { askDelete, dialog } = useDeleteAction<MaintenanceRecord>({
    title: 'Delete maintenance record?',
    message: (r) => `Delete the ${MAINTENANCE_TYPE_LABELS[r.maintenanceType]} record for ${r.vehicleNumber} on ${formatDate(r.date)}?`,
    remove: (r) => maintenanceService.remove(r.id),
    onDeleted: changed,
    successMessage: 'Maintenance record deleted',
  });

  const openForm = (record: MaintenanceRecord | null) => {
    setEditing(record);
    setFormOpen(true);
  };

  const columns: Column<MaintenanceRecord>[] = [
    { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
    ...(embedded ? [] : [{ key: 'vehicle', header: 'Vehicle', render: (r: MaintenanceRecord) => <strong>{r.vehicleNumber}</strong> }]),
    {
      key: 'type',
      header: 'Type',
      render: (r) => (
        <>
          {MAINTENANCE_TYPE_LABELS[r.maintenanceType]}
          {r.description && (
            <Typography variant="caption" color="text.secondary" component="div" noWrap sx={{ maxWidth: 220 }}>
              {r.description}
            </Typography>
          )}
        </>
      ),
    },
    { key: 'odo', header: 'Odometer', align: 'right', hideBelow: 'lg', render: (r) => (r.odometer === null ? '-' : formatNumber(r.odometer)) },
    { key: 'cost', header: 'Cost', align: 'right', render: (r) => <strong>{formatCurrency(r.cost)}</strong> },
    { key: 'next', header: 'Next Service', align: 'right', hideBelow: 'md', render: (r) => (r.nextServiceKm === null ? '-' : `${formatNumber(r.nextServiceKm)} KM`) },
    { key: 'remaining', header: 'Remaining', align: 'right', hideBelow: 'md', render: (r) => <RemainingCell record={r} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton size="small" aria-label={`Edit maintenance ${formatDate(r.date)}`} onClick={() => openForm(r)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" aria-label={`Delete maintenance ${formatDate(r.date)}`} onClick={() => askDelete(r)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const addButton = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
      Add Maintenance
    </Button>
  );
  const filtered = !!(filters.q || filters.vehicleId || filters.type || filters.from || filters.to);

  return (
    <>
      {!embedded && <PageHeader title="Maintenance" subtitle="Service history and upcoming services" actions={addButton} />}
      <ManagerToolbar action={embedded ? addButton : undefined}>
        <SearchBar value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Search maintenance..." />
        {!embedded && <FilterSelect label="Vehicle" value={filters.vehicleId} onChange={(v) => setFilter('vehicleId', v)} options={lookup.options} allLabel="All vehicles" />}
        <FilterSelect label="Type" value={filters.type} onChange={(v) => setFilter('type', v)} options={MAINTENANCE_TYPE_OPTIONS} allLabel="All types" />
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
        emptyTitle={filtered ? 'No matching records' : 'No maintenance records yet'}
        emptyMessage={filtered ? 'Try changing the search or filters.' : 'Record a service to track costs and get due-date alerts.'}
        emptyActionLabel={filtered ? undefined : 'Add Maintenance'}
        onEmptyAction={() => openForm(null)}
      />

      <MaintenanceFormDialog
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
