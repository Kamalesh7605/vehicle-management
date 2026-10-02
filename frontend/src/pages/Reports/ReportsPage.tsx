import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Box, Button, Card, Tab, Tabs, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { FilterSelect } from '../../components/common/FilterSelect';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusChip } from '../../components/common/StatusChip';
import { useApi } from '../../hooks/useApi';
import { useDriverLookup, useVehicleLookup } from '../../hooks/useLookups';
import { reportService } from '../../services/reportService';
import type {
  DriverReportRow,
  ExpenseCategory,
  MonthlyExpense,
  ReportFilters,
  VehicleExpenseRow,
  VehicleSummaryRow,
} from '../../types';
import { downloadCsv, type CsvValue } from '../../utils/csv';
import { presetRange, type DatePreset } from '../../utils/dates';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import { EXPENSE_CATEGORY_OPTIONS } from '../../utils/labels';

const TABS = ['Vehicle Expenses', 'Monthly Expenses', 'Drivers', 'Vehicle Summary'] as const;

interface ReportProps {
  filters: ReportFilters;
}

interface ReportTableProps<T> {
  title: string;
  fileName: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  rowKey: (row: T) => string | number;
  csvHeaders: string[];
  csvRow: (row: T) => CsvValue[];
  footer?: string;
}

function ReportTable<T>({ title, fileName, columns, rows, loading, error, onRetry, rowKey, csvHeaders, csvRow, footer }: ReportTableProps<T>) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="h6">{title}</Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon />}
          disabled={!rows || rows.length === 0}
          onClick={() => rows && downloadCsv(fileName, csvHeaders, rows.map(csvRow))}
        >
          Export CSV
        </Button>
      </Box>
      <DataTable
        columns={columns}
        rows={rows ?? []}
        rowKey={rowKey}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyTitle="No data for these filters"
        emptyMessage="Try a wider date range or remove some filters."
      />
      {footer && (
        <Typography fontWeight={700} textAlign="right" sx={{ mt: 1.5 }}>
          {footer}
        </Typography>
      )}
    </>
  );
}

const sum = <T,>(rows: T[] | undefined, pick: (row: T) => number) => (rows ?? []).reduce((total, row) => total + pick(row), 0);

function VehicleExpenseReport({ filters }: ReportProps) {
  const state = useApi(() => reportService.vehicleExpenses(filters), [JSON.stringify(filters)]);
  const columns: Column<VehicleExpenseRow>[] = [
    { key: 'v', header: 'Vehicle', render: (r) => <strong>{r.vehicleNumber}</strong> },
    { key: 'fuel', header: 'Fuel', align: 'right', render: (r) => formatCurrency(r.fuel) },
    { key: 'm', header: 'Maintenance', align: 'right', render: (r) => formatCurrency(r.maintenance) },
    { key: 't', header: 'Toll', align: 'right', hideBelow: 'sm', render: (r) => formatCurrency(r.toll) },
    { key: 'o', header: 'Other', align: 'right', hideBelow: 'sm', render: (r) => formatCurrency(r.other) },
    { key: 'total', header: 'Total', align: 'right', render: (r) => <strong>{formatCurrency(r.total)}</strong> },
  ];
  return (
    <ReportTable
      title="Vehicle Expense Report"
      fileName="vehicle-expenses.csv"
      columns={columns}
      rows={state.data}
      loading={state.loading}
      error={state.error}
      onRetry={state.reload}
      rowKey={(r) => r.vehicleId}
      csvHeaders={['Vehicle', 'Fuel', 'Maintenance', 'Toll', 'Other', 'Total']}
      csvRow={(r) => [r.vehicleNumber, r.fuel, r.maintenance, r.toll, r.other, r.total]}
      footer={state.data ? `Grand total: ${formatCurrency(sum(state.data, (r) => r.total))}` : undefined}
    />
  );
}

function MonthlyExpenseReport({ filters }: ReportProps) {
  const state = useApi(() => reportService.monthlyExpenses(filters), [JSON.stringify(filters)]);
  const columns: Column<MonthlyExpense>[] = [
    { key: 'month', header: 'Month', render: (r) => <strong>{r.label}</strong> },
    { key: 'fuel', header: 'Fuel', align: 'right', render: (r) => formatCurrency(r.fuel) },
    { key: 'm', header: 'Maintenance', align: 'right', render: (r) => formatCurrency(r.maintenance) },
    { key: 'o', header: 'Other', align: 'right', hideBelow: 'sm', render: (r) => formatCurrency(r.other) },
    { key: 'total', header: 'Total', align: 'right', render: (r) => <strong>{formatCurrency(r.total)}</strong> },
  ];
  return (
    <ReportTable
      title="Monthly Expense Report"
      fileName="monthly-expenses.csv"
      columns={columns}
      rows={state.data}
      loading={state.loading}
      error={state.error}
      onRetry={state.reload}
      rowKey={(r) => r.month}
      csvHeaders={['Month', 'Fuel', 'Maintenance', 'Other', 'Total']}
      csvRow={(r) => [r.label, r.fuel, r.maintenance, r.other, r.total]}
      footer={state.data ? `Grand total: ${formatCurrency(sum(state.data, (r) => r.total))}` : undefined}
    />
  );
}

function DriverReport({ filters }: ReportProps) {
  const state = useApi(
    () => reportService.drivers({ driverId: filters.driverId, vehicleId: filters.vehicleId }),
    [filters.driverId, filters.vehicleId],
  );
  const columns: Column<DriverReportRow>[] = [
    { key: 'd', header: 'Driver', render: (r) => <strong>{r.driverName}</strong> },
    { key: 'v', header: 'Vehicle', render: (r) => r.vehicleNumber ?? '-' },
    { key: 's', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
    { key: 'l', header: 'Licence Number', hideBelow: 'md', render: (r) => r.licenceNumber },
    {
      key: 'e',
      header: 'Licence Expiry',
      render: (r) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {formatDate(r.licenceExpiry)}
          {r.licenceStatus !== 'VALID' && <StatusChip status={r.licenceStatus} />}
        </Box>
      ),
    },
  ];
  return (
    <ReportTable
      title="Driver Report"
      fileName="drivers.csv"
      columns={columns}
      rows={state.data}
      loading={state.loading}
      error={state.error}
      onRetry={state.reload}
      rowKey={(r) => r.driverId}
      csvHeaders={['Driver', 'Phone', 'Vehicle', 'Status', 'Licence Number', 'Licence Expiry', 'Licence Status']}
      csvRow={(r) => [r.driverName, r.phone, r.vehicleNumber, r.status, r.licenceNumber, r.licenceExpiry, r.licenceStatus]}
    />
  );
}

function VehicleSummaryReport({ filters }: ReportProps) {
  const state = useApi(() => reportService.vehicleSummary(filters), [JSON.stringify(filters)]);
  const columns: Column<VehicleSummaryRow>[] = [
    { key: 'v', header: 'Vehicle', render: (r) => <strong>{r.vehicleNumber}</strong> },
    { key: 'fuel', header: 'Total Fuel', align: 'right', render: (r) => formatCurrency(r.totalFuel) },
    { key: 'm', header: 'Total Maintenance', align: 'right', hideBelow: 'sm', render: (r) => formatCurrency(r.totalMaintenance) },
    { key: 'total', header: 'Total Expenses', align: 'right', render: (r) => <strong>{formatCurrency(r.totalExpenses)}</strong> },
    {
      key: 'mileage',
      header: 'Mileage',
      align: 'right',
      render: (r) =>
        r.mileage === null ? (
          <Typography variant="body2" color="text.secondary" title={r.mileageNote ?? undefined}>
            Not enough data
          </Typography>
        ) : (
          `${formatNumber(r.mileage)} KM/L`
        ),
    },
  ];
  return (
    <ReportTable
      title="Vehicle Summary"
      fileName="vehicle-summary.csv"
      columns={columns}
      rows={state.data}
      loading={state.loading}
      error={state.error}
      onRetry={state.reload}
      rowKey={(r) => r.vehicleId}
      csvHeaders={['Vehicle', 'Total Fuel', 'Total Maintenance', 'Total Expenses', 'Mileage (KM/L)']}
      csvRow={(r) => [r.vehicleNumber, r.totalFuel, r.totalMaintenance, r.totalExpenses, r.mileage]}
    />
  );
}

export function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [preset, setPreset] = useState<DatePreset>('THIS_MONTH');
  const [range, setRange] = useState(presetRange('THIS_MONTH'));
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [category, setCategory] = useState('');
  const vehicles = useVehicleLookup();
  const drivers = useDriverLookup();

  const isDriverTab = tab === 2;
  const filters = useMemo<ReportFilters>(
    () => ({
      from: range.from || undefined,
      to: range.to || undefined,
      vehicleId: vehicleId ? Number(vehicleId) : undefined,
      driverId: driverId ? Number(driverId) : undefined,
      category: (category || undefined) as ExpenseCategory | undefined,
    }),
    [range.from, range.to, vehicleId, driverId, category],
  );

  return (
    <>
      <PageHeader title="Reports" subtitle="Expense, driver and vehicle reports with CSV export" />

      <Card sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          {!isDriverTab && (
            <DateRangeFilter
              allowCustom
              preset={preset}
              range={range}
              onChange={(p, r) => {
                setPreset(p);
                setRange(r);
              }}
            />
          )}
          <FilterSelect label="Vehicle" value={vehicleId} onChange={setVehicleId} options={vehicles.options} allLabel="All vehicles" />
          <FilterSelect label="Driver" value={driverId} onChange={setDriverId} options={drivers.options} allLabel="All drivers" />
          {!isDriverTab && (
            <FilterSelect label="Category" value={category} onChange={setCategory} options={EXPENSE_CATEGORY_OPTIONS} allLabel="All categories" />
          )}
        </Box>
      </Card>

      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {tab === 0 && <VehicleExpenseReport filters={filters} />}
      {tab === 1 && <MonthlyExpenseReport filters={filters} />}
      {tab === 2 && <DriverReport filters={filters} />}
      {tab === 3 && <VehicleSummaryReport filters={filters} />}
    </>
  );
}
