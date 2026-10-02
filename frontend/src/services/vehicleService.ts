import type {
  Assignment,
  AssignmentRequest,
  FuelType,
  Vehicle,
  VehicleRequest,
  VehicleStatus,
  VehicleSummary,
} from '../types';
import { api, cleanParams } from './api';

export interface VehicleQuery {
  q?: string;
  status?: VehicleStatus;
  fuelType?: FuelType;
}

export const vehicleService = {
  list: (query: VehicleQuery = {}) =>
    api.get<Vehicle[]>('/vehicles', { params: cleanParams(query) }).then((r) => r.data),
  get: (id: number) => api.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),
  summary: (id: number) => api.get<VehicleSummary>(`/vehicles/${id}/summary`).then((r) => r.data),
  driverHistory: (id: number) => api.get<Assignment[]>(`/vehicles/${id}/driver-history`).then((r) => r.data),
  create: (body: VehicleRequest) => api.post<Vehicle>('/vehicles', body).then((r) => r.data),
  update: (id: number, body: VehicleRequest) => api.put<Vehicle>(`/vehicles/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/vehicles/${id}`).then(() => undefined),
  assignDriver: (body: AssignmentRequest) =>
    api.post<Assignment>('/vehicle-driver-assignments', body).then((r) => r.data),
};
