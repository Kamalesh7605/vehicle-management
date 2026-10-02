import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Button, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { DataTable, type Column } from '../../components/common/DataTable';
import { FilterSelect } from '../../components/common/FilterSelect';
import { ManagerToolbar } from '../../components/common/ManagerToolbar';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { StatusChip } from '../../components/common/StatusChip';
import { useApi } from '../../hooks/useApi';
import { useNotify } from '../../hooks/useNotify';
import { getErrorMessage } from '../../services/api';
import { useDeleteAction } from '../../hooks/useDeleteAction';
import { useDriverLookup, useVehicleLookup } from '../../hooks/useLookups';
import { usePagedFilters } from '../../hooks/usePagedFilters';
import { documentService } from '../../services/documentService';
import type { AppDocument, DocumentStatus, DocumentType } from '../../types';
import { formatDate, formatDaysRemaining } from '../../utils/format';
import { DOCUMENT_STATUS_OPTIONS, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_OPTIONS } from '../../utils/labels';
import { DocumentFormDialog } from './DocumentFormDialog';

interface Props {
  vehicleId?: number;
  embedded?: boolean;
  onChanged?: () => void;
}

export function DocumentManager({ vehicleId, embedded = false, onChanged }: Props) {
  const { filters, setFilter, page, setPage, size, setSize } = usePagedFilters({ q: '', type: '', status: '', vehicleId: '' });
  const notify = useNotify();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppDocument | null>(null);
  const vehicles = useVehicleLookup();
  const drivers = useDriverLookup(!embedded);

  const effectiveVehicleId = vehicleId ?? (filters.vehicleId ? Number(filters.vehicleId) : undefined);
  const list = useApi(
    () =>
      documentService.list({
        q: filters.q,
        type: (filters.type || undefined) as DocumentType | undefined,
        status: (filters.status || undefined) as DocumentStatus | undefined,
        vehicleId: effectiveVehicleId,
        page,
        size,
      }),
    [filters.q, filters.type, filters.status, effectiveVehicleId, page, size],
  );

  const changed = () => {
    list.reload();
    onChanged?.();
  };

  const { askDelete, dialog } = useDeleteAction<AppDocument>({
    title: 'Delete document?',
    message: (d) => `Delete the ${DOCUMENT_TYPE_LABELS[d.documentType]} for ${d.vehicleNumber ?? d.driverName}? Any attached file is deleted too.`,
    remove: (d) => documentService.remove(d.id),
    onDeleted: changed,
    successMessage: 'Document deleted',
  });

  const openForm = (record: AppDocument | null) => {
    setEditing(record);
    setFormOpen(true);
  };

  const columns: Column<AppDocument>[] = [
    { key: 'type', header: 'Document', render: (d) => <strong>{DOCUMENT_TYPE_LABELS[d.documentType]}</strong> },
    ...(embedded
      ? []
      : [
          { key: 'kind', header: 'Type', hideBelow: 'md' as const, render: (d: AppDocument) => (d.driverId ? 'Driver' : 'Vehicle') },
          { key: 'owner', header: 'Vehicle / Driver', render: (d: AppDocument) => d.vehicleNumber ?? d.driverName ?? '-' },
        ]),
    { key: 'number', header: 'Number', hideBelow: 'md', render: (d) => d.documentNumber ?? '-' },
    {
      key: 'expiry',
      header: 'Expiry Date',
      render: (d) => (
        <>
          {formatDate(d.expiryDate)}
          <Typography variant="caption" color={d.status === 'VALID' ? 'text.secondary' : d.status === 'EXPIRED' ? 'error' : 'warning.dark'} component="div">
            {formatDaysRemaining(d.daysRemaining)}
          </Typography>
        </>
      ),
    },
    { key: 'status', header: 'Status', render: (d) => <StatusChip status={d.status} /> },
    {
      key: 'file',
      header: 'File',
      hideBelow: 'sm',
      render: (d) =>
        d.hasFile ? (
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => documentService.openFile(d.id).catch((e: unknown) => notify.error(getErrorMessage(e)))}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <AttachFileIcon fontSize="small" /> View
          </Link>
        ) : (
          '-'
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (d) => (
        <Stack direction="row" justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton size="small" aria-label={`Edit ${DOCUMENT_TYPE_LABELS[d.documentType]}`} onClick={() => openForm(d)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" aria-label={`Delete ${DOCUMENT_TYPE_LABELS[d.documentType]}`} onClick={() => askDelete(d)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const addButton = (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
      Add Document
    </Button>
  );
  const filtered = !!(filters.q || filters.type || filters.status || filters.vehicleId);

  return (
    <>
      {!embedded && <PageHeader title="Documents" subtitle="Track expiry of vehicle and driver documents" actions={addButton} />}
      <ManagerToolbar action={embedded ? addButton : undefined}>
        <SearchBar value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Search documents..." />
        <FilterSelect label="Type" value={filters.type} onChange={(v) => setFilter('type', v)} options={DOCUMENT_TYPE_OPTIONS} allLabel="All types" />
        <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilter('status', v)} options={DOCUMENT_STATUS_OPTIONS} />
        {!embedded && <FilterSelect label="Vehicle" value={filters.vehicleId} onChange={(v) => setFilter('vehicleId', v)} options={vehicles.options} allLabel="All vehicles" />}
      </ManagerToolbar>

      <DataTable
        columns={columns}
        rows={list.data?.content ?? []}
        rowKey={(d) => d.id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        pagination={{ page, pageSize: size, total: list.data?.totalElements ?? 0, onPageChange: setPage, onPageSizeChange: setSize }}
        emptyTitle={filtered ? 'No matching documents' : 'No documents yet'}
        emptyMessage={filtered ? 'Try changing the search or filters.' : 'Add insurance, RC, fitness and other documents to get expiry alerts.'}
        emptyActionLabel={filtered ? undefined : 'Add Document'}
        onEmptyAction={() => openForm(null)}
      />

      <DocumentFormDialog
        open={formOpen}
        record={editing}
        defaultVehicleId={vehicleId}
        vehicleOptions={vehicles.options}
        driverOptions={drivers.options}
        onClose={() => setFormOpen(false)}
        onSaved={changed}
      />
      {dialog}
    </>
  );
}
