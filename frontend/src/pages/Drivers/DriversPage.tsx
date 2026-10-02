import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DirectionsBusOutlinedIcon from '@mui/icons-material/DirectionsBusOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Button, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { DataTable, type Column } from '../../components/common/DataTable';
import { FilterSelect } from '../../components/common/FilterSelect';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusChip } from '../../components/common/StatusChip';
import { useApi } from '../../hooks/useApi';
import { useDeleteAction } from '../../hooks/useDeleteAction';
import { useUrlSearch } from '../../hooks/useUrlSearch';
import { driverService } from '../../services/driverService';
import type { Driver, DriverStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { DRIVER_STATUS_OPTIONS } from '../../utils/labels';
import { AssignDriverDialog } from '../Vehicles/AssignDriverDialog';
import { DriverFormDialog } from './DriverFormDialog';

export function DriversPage() {
  const [q, setQ] = useUrlSearch();
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [assigning, setAssigning] = useState<Driver | null>(null);

  const drivers = useApi(() => driverService.list({ q, status: (status || undefined) as DriverStatus | undefined }), [q, status]);

  const { askDelete, dialog } = useDeleteAction<Driver>({
    title: 'Delete driver?',
    message: (d) => `Delete ${d.name}? Their assignment history and licence documents will be removed. This cannot be undone.`,
    remove: (d) => driverService.remove(d.id),
    onDeleted: drivers.reload,
    successMessage: 'Driver deleted',
  });

  const openForm = (driver: Driver | null) => {
    setEditing(driver);
    setFormOpen(true);
  };

  const columns: Column<Driver>[] = [
    { key: 'name', header: 'Name', render: (d) => <Typography fontWeight={600}>{d.name}</Typography> },
    { key: 'phone', header: 'Phone', hideBelow: 'sm', render: (d) => d.phone },
    {
      key: 'vehicle',
      header: 'Assigned Vehicle',
      hideBelow: 'md',
      render: (d) =>
        d.assignedVehicleId ? (
          <Link component={RouterLink} to={`/vehicles/${d.assignedVehicleId}`} underline="hover">
            {d.assignedVehicleNumber}
          </Link>
        ) : (
          '-'
        ),
    },
    { key: 'licence', header: 'Licence Number', hideBelow: 'lg', render: (d) => d.licenceNumber },
    {
      key: 'expiry',
      header: 'Licence Expiry',
      hideBelow: 'sm',
      render: (d) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <span>{formatDate(d.licenceExpiry)}</span>
          {d.licenceStatus !== 'VALID' && <StatusChip status={d.licenceStatus} />}
        </Stack>
      ),
    },
    { key: 'status', header: 'Status', render: (d) => <StatusChip status={d.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (d) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title={d.status === 'INACTIVE' ? 'Inactive drivers cannot be assigned' : 'Assign vehicle'}>
            <span>
              <IconButton size="small" aria-label={`Assign vehicle to ${d.name}`} disabled={d.status === 'INACTIVE'} onClick={() => setAssigning(d)}>
                <DirectionsBusOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" aria-label={`Edit ${d.name}`} onClick={() => openForm(d)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" aria-label={`Delete ${d.name}`} onClick={() => askDelete(d)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const filtered = !!(q || status);

  return (
    <>
      <PageHeader
        title="Drivers"
        subtitle="Manage drivers and their vehicle assignments"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
            Add Driver
          </Button>
        }
      />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <SearchBar value={q} onChange={setQ} placeholder="Search drivers..." />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={DRIVER_STATUS_OPTIONS} />
      </Box>

      <DataTable
        columns={columns}
        rows={drivers.data ?? []}
        rowKey={(d) => d.id}
        loading={drivers.loading}
        error={drivers.error}
        onRetry={drivers.reload}
        emptyTitle={filtered ? 'No matching drivers' : 'No drivers yet'}
        emptyMessage={filtered ? 'Try changing the search or filter.' : 'Add your first driver to get started.'}
        emptyActionLabel={filtered ? undefined : 'Add Driver'}
        onEmptyAction={() => openForm(null)}
      />

      <DriverFormDialog open={formOpen} driver={editing} onClose={() => setFormOpen(false)} onSaved={drivers.reload} />
      <AssignDriverDialog open={!!assigning} driver={assigning} onClose={() => setAssigning(null)} onDone={drivers.reload} />
      {dialog}
    </>
  );
}
