import type { MaintenanceRecord, MaintenanceRequest, MaintenanceType, PageResponse } from '../types';
import { api, cleanParams } from './api';

export interface MaintenanceQuery {
  q?: string;
  vehicleId?: number;
  type?: MaintenanceType;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const maintenanceService = {
  list: (query: MaintenanceQuery = {}) =>
    api.get<PageResponse<MaintenanceRecord>>('/maintenance', { params: cleanParams(query) }).then((r) => r.data),
  create: (body: MaintenanceRequest) => api.post<MaintenanceRecord>('/maintenance', body).then((r) => r.data),
  update: (id: number, body: MaintenanceRequest) =>
    api.put<MaintenanceRecord>(`/maintenance/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/maintenance/${id}`).then(() => undefined),
};
