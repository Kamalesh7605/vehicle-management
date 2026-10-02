import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { Box, Button, Card, Chip, Divider, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { DataTable, type Column } from '../../components/common/DataTable';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { StatusChip } from '../../components/common/StatusChip';
import { useApi } from '../../hooks/useApi';
import { vehicleService } from '../../services/vehicleService';
import { brand } from '../../theme/theme';
import type { Assignment, VehicleSummary } from '../../types';
import { formatCurrency, formatDate, formatKm, formatNumber } from '../../utils/format';
import { FUEL_TYPE_LABELS } from '../../utils/labels';
import { DocumentManager } from '../Documents/DocumentManager';
import { ExpenseManager } from '../Expenses/ExpenseManager';
import { FuelManager } from '../Fuel/FuelManager';
import { MaintenanceManager } from '../Maintenance/MaintenanceManager';
import { AssignDriverDialog } from './AssignDriverDialog';
import { VehicleFormDialog } from './VehicleFormDialog';

const TABS = ['Overview', 'Fuel', 'Maintenance', 'Expenses', 'Documents', 'Driver History'] as const;

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ py: 1.25 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right" component="div">
        {children}
      </Typography>
    </Stack>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Divider />
      {children}
    </Card>
  );
}

function ExpenseDot({ color }: { color: string }) {
  return <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', bgcolor: color, mr: 1 }} />;
}

function Overview({ summary }: { summary: VehicleSummary }) {
  const { vehicle, mileage, service } = summary;
  const remaining = service.remainingKm;

  return (
    <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
      <Panel title="Vehicle Information">
        <InfoRow label="Assigned Driver">{vehicle.assignedDriverName ?? 'Not assigned'}</InfoRow>
        {summary.driverSince && <InfoRow label="Driving since">{formatDate(summary.driverSince)}</InfoRow>}
        <InfoRow label="Registration Date">{formatDate(vehicle.registrationDate)}</InfoRow>
        <InfoRow label="Vehicle Type">{vehicle.vehicleType ?? '-'}</InfoRow>
        <InfoRow label="Manufacturing Year">{vehicle.manufacturingYear ?? '-'}</InfoRow>
        <InfoRow label="Current Odometer">{formatKm(vehicle.currentOdometer)}</InfoRow>
        <InfoRow label="Last Fuel Entry">{formatDate(summary.lastFuelDate)}</InfoRow>
      </Panel>

      <Panel title="Expense Summary">
        <InfoRow label="Fuel">
          <ExpenseDot color={brand.fuel} />
          {formatCurrency(summary.totalFuelCost)}
        </InfoRow>
        <InfoRow label="Maintenance">
          <ExpenseDot color={brand.maintenance} />
          {formatCurrency(summary.totalMaintenanceCost)}
        </InfoRow>
        <InfoRow label="Other Expenses">
          <ExpenseDot color={brand.other} />
          {formatCurrency(summary.totalOtherExpenses)}
        </InfoRow>
        <Divider />
        <InfoRow label="Total Expenses">
          <Typography component="span" fontWeight={700} fontSize={18}>
            {formatCurrency(summary.totalExpenses)}
          </Typography>
        </InfoRow>
      </Panel>

      <Panel title="Mileage">
        {mileage.mileage !== null ? (
          <>
            <InfoRow label="Average Mileage">
              <Typography component="span" fontWeight={700} fontSize={18}>
                {mileage.mileage.toFixed(2)} KM/L
              </Typography>
            </InfoRow>
            <InfoRow label="Distance covered">{formatKm(mileage.distanceKm)}</InfoRow>
            <InfoRow label="Fuel used">{formatNumber(mileage.fuelUsedLitres)} L</InfoRow>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            Mileage is not available yet. {mileage.message}
          </Typography>
        )}
      </Panel>

      <Panel title="Next Service">
        {service.nextServiceKm === null ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No next-service target set. Add one when you record maintenance.
          </Typography>
        ) : (
          <>
            <InfoRow label="Current KM">{formatKm(vehicle.currentOdometer)}</InfoRow>
            <InfoRow label="Next Service">{formatKm(service.nextServiceKm)}</InfoRow>
            <InfoRow label="Remaining">
              <Chip
                size="small"
                color={remaining !== null && remaining <= 0 ? 'error' : service.due ? 'warning' : 'success'}
                label={remaining !== null && remaining <= 0 ? `Overdue by ${formatNumber(-remaining)} KM` : `${formatNumber(remaining)} KM`}
              />
            </InfoRow>
            <InfoRow label="Last Service">{formatDate(service.lastServiceDate)}</InfoRow>
          </>
        )}
        {(summary.expiredDocuments > 0 || summary.expiringDocuments > 0) && (
          <>
            <Divider />
            <InfoRow label="Documents">
              <Stack direction="row" spacing={1}>
                {summary.expiredDocuments > 0 && <Chip size="small" color="error" label={`${summary.expiredDocuments} expired`} />}
                {summary.expiringDocuments > 0 && <Chip size="small" color="warning" label={`${summary.expiringDocuments} expiring soon`} />}
              </Stack>
            </InfoRow>
          </>
        )}
      </Panel>
    </Box>
  );
}

const historyColumns: Column<Assignment>[] = [
  { key: 'driver', header: 'Driver', render: (a) => <strong>{a.driverName}</strong> },
  { key: 'from', header: 'From', render: (a) => formatDate(a.startDate) },
  { key: 'to', header: 'To', render: (a) => (a.current ? 'Current' : formatDate(a.endDate)) },
  { key: 'status', header: 'Status', render: (a) => <StatusChip status={a.current ? 'ACTIVE' : 'INACTIVE'} label={a.current ? 'Current' : 'Past'} /> },
];

export function VehicleDetailsPage() {
  const id = Number(useParams().id);
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const summary = useApi(() => vehicleService.summary(id), [id]);
  const history = useApi(() => vehicleService.driverHistory(id), [id]);

  const refresh = () => {
    summary.reload();
    history.reload();
  };

  if (summary.loading && !summary.data) return <LoadingState message="Loading vehicle..." />;
  if (summary.error || !summary.data) {
    return <ErrorState message={summary.error ?? 'Vehicle not found'} onRetry={summary.reload} />;
  }

  const { vehicle } = summary.data;

  return (
    <>
      <Button component={RouterLink} to="/vehicles" startIcon={<ArrowBackIcon />} color="inherit" sx={{ mb: 1.5 }}>
        Back to vehicles
      </Button>

      <Card sx={{ p: 2.5, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h4" component="h1">
                {vehicle.vehicleNumber}
              </Typography>
              <StatusChip status={vehicle.status} label={vehicle.status === 'MAINTENANCE' ? 'In Service' : undefined} />
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {[vehicle.manufacturer, vehicle.model].filter(Boolean).join(' ') || 'Vehicle'} • {FUEL_TYPE_LABELS[vehicle.fuelType]} •{' '}
              {formatKm(vehicle.currentOdometer)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setAssignOpen(true)}>
              {vehicle.assignedDriverId ? 'Change Driver' : 'Assign Driver'}
            </Button>
            <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {tab === 0 && <Overview summary={summary.data} />}
      {tab === 1 && <FuelManager vehicleId={id} embedded onChanged={refresh} />}
      {tab === 2 && <MaintenanceManager vehicleId={id} embedded onChanged={refresh} />}
      {tab === 3 && <ExpenseManager vehicleId={id} embedded onChanged={refresh} />}
      {tab === 4 && <DocumentManager vehicleId={id} embedded onChanged={refresh} />}
      {tab === 5 && (
        <DataTable
          columns={historyColumns}
          rows={history.data ?? []}
          rowKey={(a) => a.id}
          loading={history.loading}
          error={history.error}
          onRetry={history.reload}
          emptyTitle="No driver history"
          emptyMessage="Assign a driver to start the history."
        />
      )}

      <VehicleFormDialog open={editOpen} vehicle={vehicle} onClose={() => setEditOpen(false)} onSaved={refresh} />
      <AssignDriverDialog open={assignOpen} vehicle={vehicle} onClose={() => setAssignOpen(false)} onDone={refresh} />
    </>
  );
}
