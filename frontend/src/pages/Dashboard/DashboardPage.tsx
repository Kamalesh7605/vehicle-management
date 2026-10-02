import BuildIcon from '@mui/icons-material/Build';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Box, Card, MenuItem, TextField, Typography } from '@mui/material';
import { useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { StatCard } from '../../components/cards/StatCard';
import { ExpenseBreakdownChart } from '../../components/charts/ExpenseBreakdownChart';
import { MonthlyExpensesChart } from '../../components/charts/MonthlyExpensesChart';
import { DataTable, type Column } from '../../components/common/DataTable';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import { PageHeader } from '../../components/common/PageHeader';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/dashboardService';
import { brand } from '../../theme/theme';
import type { Expense, FuelRecord, MaintenanceRecord } from '../../types';
import { presetRange, PRESET_LABELS, type DatePreset } from '../../utils/dates';
import { formatCurrency, formatDate } from '../../utils/format';
import { EXPENSE_CATEGORY_LABELS, MAINTENANCE_TYPE_LABELS } from '../../utils/labels';
import { AlertsCard } from './AlertsCard';

function Section({
  title,
  action,
  children,
  padded = true,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <Card sx={{ p: padded ? 2.5 : 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: padded ? 0 : 2.5, pt: padded ? 0 : 2.5 }}>
        <Typography variant="h6">{title}</Typography>
        {action}
      </Box>
      {children}
    </Card>
  );
}

const fuelColumns: Column<FuelRecord>[] = [
  { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
  { key: 'vehicle', header: 'Vehicle', render: (r) => r.vehicleNumber },
  { key: 'qty', header: 'Quantity', hideBelow: 'sm', render: (r) => `${r.quantity} L` },
  { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.totalAmount) },
];

const maintenanceColumns: Column<MaintenanceRecord>[] = [
  { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
  { key: 'vehicle', header: 'Vehicle', render: (r) => r.vehicleNumber },
  { key: 'type', header: 'Type', hideBelow: 'sm', render: (r) => MAINTENANCE_TYPE_LABELS[r.maintenanceType] },
  { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.cost) },
];

const expenseColumns: Column<Expense>[] = [
  { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
  { key: 'vehicle', header: 'Vehicle', render: (r) => r.vehicleNumber },
  { key: 'category', header: 'Category', hideBelow: 'sm', render: (r) => EXPENSE_CATEGORY_LABELS[r.category] },
  { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
];

export function DashboardPage() {
  const [preset, setPreset] = useState<DatePreset>('THIS_MONTH');
  const [range, setRange] = useState(presetRange('THIS_MONTH'));
  const [year, setYear] = useState(new Date().getFullYear());

  const summary = useApi(() => dashboardService.summary(range), [range.from, range.to]);
  const breakdown = useApi(() => dashboardService.expenseBreakdown(range), [range.from, range.to]);
  const monthly = useApi(() => dashboardService.monthlyExpenses(year), [year]);
  const alerts = useApi(dashboardService.alerts, []);
  const recentFuel = useApi(() => dashboardService.recentFuel(5), []);
  const recentMaintenance = useApi(() => dashboardService.recentMaintenance(5), []);
  const recentExpenses = useApi(() => dashboardService.recentExpenses(5), []);

  const s = summary.data;
  const periodLabel = PRESET_LABELS[preset];
  const thisYear = new Date().getFullYear();

  const viewAll = (to: string) => (
    <Typography component={RouterLink} to={to} variant="body2" color="primary" fontWeight={600} sx={{ textDecoration: 'none' }}>
      View All
    </Typography>
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your vehicles, drivers and expenses"
        actions={
          <DateRangeFilter
            preset={preset}
            range={range}
            onChange={(p, r) => {
              setPreset(p);
              setRange(r);
            }}
          />
        }
      />

      {summary.error && !s ? (
        <Card sx={{ mb: 3 }}>
          <ErrorState message={summary.error} onRetry={summary.reload} />
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2.5,
            mb: 3,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(5, 1fr)' },
          }}
        >
          <StatCard
            title="Vehicles"
            value={s ? String(s.totalVehicles) : '-'}
            caption={s && `${s.activeVehicles} Active • ${s.inServiceVehicles} In Service`}
            icon={<DirectionsBusIcon />}
            tint="#DBEAFE"
            color="#2563EB"
          />
          <StatCard
            title="Drivers"
            value={s ? String(s.totalDrivers) : '-'}
            caption={s && `${s.activeDrivers} Active • ${s.inactiveDrivers} Inactive`}
            icon={<PersonIcon />}
            tint="#DCFCE7"
            color="#16A34A"
          />
          <StatCard
            title="Fuel Expense"
            value={s ? formatCurrency(Math.round(s.fuelExpense)) : '-'}
            caption={periodLabel}
            icon={<LocalGasStationIcon />}
            tint="#EDE9FE"
            color="#7C3AED"
          />
          <StatCard
            title="Maintenance"
            value={s ? formatCurrency(Math.round(s.maintenanceExpense)) : '-'}
            caption={periodLabel}
            icon={<BuildIcon />}
            tint="#FEF3C7"
            color="#D97706"
          />
          <StatCard
            title="Other Expenses"
            value={s ? formatCurrency(Math.round(s.otherExpense)) : '-'}
            caption={periodLabel}
            icon={<ReceiptLongIcon />}
            tint="#FFE4E6"
            color={brand.other}
          />
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))', xl: '1.4fr 1.15fr 1.1fr' },
        }}
      >
        <Section
          title="Monthly Expenses"
          action={
            <TextField select value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 130 }}>
              <MenuItem value={thisYear}>This Year</MenuItem>
              <MenuItem value={thisYear - 1}>Last Year</MenuItem>
            </TextField>
          }
        >
          {monthly.error ? (
            <ErrorState message={monthly.error} onRetry={monthly.reload} />
          ) : monthly.data ? (
            <MonthlyExpensesChart data={monthly.data} />
          ) : (
            <LoadingState />
          )}
        </Section>

        <Section
          title={
            <>
              Expense Breakdown{' '}
              <Typography component="span" variant="body2" color="text.secondary">
                ({periodLabel})
              </Typography>
            </>
          }
        >
          {breakdown.error ? (
            <ErrorState message={breakdown.error} onRetry={breakdown.reload} />
          ) : breakdown.data ? (
            <ExpenseBreakdownChart data={breakdown.data} />
          ) : (
            <LoadingState />
          )}
        </Section>

        <Section title="Alerts & Notifications">
          <AlertsCard alerts={alerts.data} loading={alerts.loading} error={alerts.error} onRetry={alerts.reload} />
        </Section>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        <Section title="Recent Fuel Entries" padded={false} action={viewAll('/fuel')}>
          <DataTable columns={fuelColumns} rows={recentFuel.data ?? []} rowKey={(r) => r.id} loading={recentFuel.loading}
            error={recentFuel.error} onRetry={recentFuel.reload} paginate={false} elevated={false} dense emptyMessage="No fuel entries yet." />
        </Section>
        <Section title="Recent Maintenance" padded={false} action={viewAll('/maintenance')}>
          <DataTable columns={maintenanceColumns} rows={recentMaintenance.data ?? []} rowKey={(r) => r.id}
            loading={recentMaintenance.loading} error={recentMaintenance.error} onRetry={recentMaintenance.reload}
            paginate={false} elevated={false} dense emptyMessage="No maintenance records yet." />
        </Section>
        <Section title="Recent Expenses" padded={false} action={viewAll('/expenses')}>
          <DataTable columns={expenseColumns} rows={recentExpenses.data ?? []} rowKey={(r) => r.id}
            loading={recentExpenses.loading} error={recentExpenses.error} onRetry={recentExpenses.reload}
            paginate={false} elevated={false} dense emptyMessage="No expenses yet." />
        </Section>
      </Box>
    </>
  );
}
