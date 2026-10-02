import type {
  DriverReportRow,
  DriverStatus,
  MonthlyExpense,
  ReportFilters,
  VehicleExpenseRow,
  VehicleSummaryRow,
} from '../types';
import { api, cleanParams } from './api';

export const reportService = {
  vehicleExpenses: (filters: ReportFilters) =>
    api.get<VehicleExpenseRow[]>('/reports/vehicle-expenses', { params: cleanParams(filters) }).then((r) => r.data),
  monthlyExpenses: (filters: ReportFilters) =>
    api.get<MonthlyExpense[]>('/reports/monthly-expenses', { params: cleanParams(filters) }).then((r) => r.data),
  drivers: (filters: { driverId?: number; vehicleId?: number; status?: DriverStatus }) =>
    api.get<DriverReportRow[]>('/reports/drivers', { params: cleanParams(filters) }).then((r) => r.data),
  vehicleSummary: (filters: ReportFilters) =>
    api.get<VehicleSummaryRow[]>('/reports/vehicle-summary', { params: cleanParams(filters) }).then((r) => r.data),
};
