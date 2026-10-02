import type {
  Alert,
  DashboardSummary,
  Expense,
  ExpenseBreakdown,
  FuelRecord,
  MaintenanceRecord,
  MonthlyExpense,
} from '../types';
import { api } from './api';

export interface RangeQuery {
  from?: string;
  to?: string;
}

export const dashboardService = {
  summary: (params: RangeQuery = {}) =>
    api.get<DashboardSummary>('/dashboard/summary', { params }).then((r) => r.data),
  monthlyExpenses: (year: number) =>
    api.get<MonthlyExpense[]>('/dashboard/monthly-expenses', { params: { year } }).then((r) => r.data),
  expenseBreakdown: (params: RangeQuery = {}) =>
    api.get<ExpenseBreakdown>('/dashboard/expense-breakdown', { params }).then((r) => r.data),
  recentFuel: (limit = 5) =>
    api.get<FuelRecord[]>('/dashboard/recent-fuel', { params: { limit } }).then((r) => r.data),
  recentMaintenance: (limit = 5) =>
    api.get<MaintenanceRecord[]>('/dashboard/recent-maintenance', { params: { limit } }).then((r) => r.data),
  recentExpenses: (limit = 5) =>
    api.get<Expense[]>('/dashboard/recent-expenses', { params: { limit } }).then((r) => r.data),
  alerts: () => api.get<Alert[]>('/dashboard/alerts').then((r) => r.data),
  markAlertsRead: () => api.post('/dashboard/alerts/read').then(() => undefined),
};
