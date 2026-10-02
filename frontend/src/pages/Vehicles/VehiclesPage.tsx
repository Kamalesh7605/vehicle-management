import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '../../components/common/DataTable';
import { FilterSelect } from '../../components/common/FilterSelect';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusChip } from '../../components/common/StatusChip';
import { useApi } from '../../hooks/useApi';
import { useDeleteAction } from '../../hooks/useDeleteAction';
import { useUrlSearch } from '../../hooks/useUrlSearch';
import { vehicleService } from '../../services/vehicleService';
import type { Vehicle } from '../../types';
import { formatNumber } from '../../utils/format';
import { FUEL_TYPE_LABELS, FUEL_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from '../../utils/labels';
import { AssignDriverDialog } from './AssignDriverDialog';
import { VehicleFormDialog } from './VehicleFormDialog';

export function VehiclesPage() {
  const navigate = useNavigate();
  const [q, setQ] = useUrlSearch();
  const [status, setStatus] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [assigning, setAssigning] = useState<Vehicle | null>(null);

  const vehicles = useApi(
    () => vehicleService.list({ q, status: (status || undefined) as Vehicle['status'], fuelType: (fuelType || undefined) as Vehicle['fuelType'] }),
    [q, status, fuelType],
  );

  const { askDelete, dialog } = useDeleteAction<Vehicle>({
    title: 'Delete vehicle?',
    message: (v) =>
      `Delete ${v.vehicleNumber}? Its fuel, maintenance, expense, document and driver-history records will be deleted too. This cannot be undone.`,
    remove: (v) => vehicleService.remove(v.id),
    onDeleted: vehicles.reload,
    successMessage: 'Vehicle deleted',
  });

  const openForm = (vehicle: Vehicle | null) => {
    setEditing(vehicle);
    setFormOpen(true);
  };

  const columns: Column<Vehicle>[] = [
    {
      key: 'number',
      header: 'Vehicle Number',
      render: (v) => (
        <Link component={RouterLink} to={`/vehicles/${v.id}`} underline="hover" fontWeight={600} onClick={(e) => e.stopPropagation()}>
          {v.vehicleNumber}
        </Link>
      ),
    },
    {
      key: 'model',
      header: 'Model',
      hideBelow: 'md',
      render: (v) => [v.manufacturer, v.model].filter(Boolean).join(' ') || '-',
    },
    { key: 'fuel', header: 'Fuel Type', hideBelow: 'sm', render: (v) => FUEL_TYPE_LABELS[v.fuelType] },
    { key: 'km', header: 'Current KM', align: 'right', hideBelow: 'sm', render: (v) => formatNumber(v.currentOdometer) },
    { key: 'driver', header: 'Assigned Driver', hideBelow: 'md', render: (v) => v.assignedDriverName ?? '-' },
    { key: 'status', header: 'Status', render: (v) => <StatusChip status={v.status} label={v.status === 'MAINTENANCE' ? 'In Service' : undefined} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (v) => (
        <Stack direction="row" justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View details">
            <IconButton size="small" aria-label={`View ${v.vehicleNumber}`} onClick={() => navigate(`/vehicles/${v.id}`)}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Assign driver">
            <IconButton size="small" aria-label={`Assign driver to ${v.vehicleNumber}`} onClick={() => setAssigning(v)}>
              <PersonAddAltOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" aria-label={`Edit ${v.vehicleNumber}`} onClick={() => openForm(v)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" aria-label={`Delete ${v.vehicleNumber}`} onClick={() => askDelete(v)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Vehicles"
        subtitle="Manage your fleet"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
            Add Vehicle
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <SearchBar value={q} onChange={setQ} placeholder="Search vehicles..." />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={VEHICLE_STATUS_OPTIONS} />
        <FilterSelect label="Fuel Type" value={fuelType} onChange={setFuelType} options={FUEL_TYPE_OPTIONS} />
      </Box>

      <DataTable
        columns={columns}
        rows={vehicles.data ?? []}
        rowKey={(v) => v.id}
        loading={vehicles.loading}
        error={vehicles.error}
        onRetry={vehicles.reload}
        onRowClick={(v) => navigate(`/vehicles/${v.id}`)}
        emptyTitle={q || status || fuelType ? 'No matching vehicles' : 'No vehicles yet'}
        emptyMessage={q || status || fuelType ? 'Try changing the search or filters.' : 'Add your first vehicle to get started.'}
        emptyActionLabel={q || status || fuelType ? undefined : 'Add Vehicle'}
        onEmptyAction={() => openForm(null)}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {vehicles.data ? `${vehicles.data.length} vehicle${vehicles.data.length === 1 ? '' : 's'}` : ''}
      </Typography>

      <VehicleFormDialog open={formOpen} vehicle={editing} onClose={() => setFormOpen(false)} onSaved={vehicles.reload} />
      <AssignDriverDialog open={!!assigning} vehicle={assigning} onClose={() => setAssigning(null)} onDone={vehicles.reload} />
      {dialog}
    </>
  );
}
