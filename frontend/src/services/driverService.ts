import type { Assignment, Driver, DriverRequest, DriverStatus } from '../types';
import { api, cleanParams } from './api';

export interface DriverQuery {
  q?: string;
  status?: DriverStatus;
}

export const driverService = {
  list: (query: DriverQuery = {}) =>
    api.get<Driver[]>('/drivers', { params: cleanParams(query) }).then((r) => r.data),
  get: (id: number) => api.get<Driver>(`/drivers/${id}`).then((r) => r.data),
  vehicleHistory: (id: number) => api.get<Assignment[]>(`/drivers/${id}/vehicle-history`).then((r) => r.data),
  create: (body: DriverRequest) => api.post<Driver>('/drivers', body).then((r) => r.data),
  update: (id: number, body: DriverRequest) => api.put<Driver>(`/drivers/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/drivers/${id}`).then(() => undefined),
};
