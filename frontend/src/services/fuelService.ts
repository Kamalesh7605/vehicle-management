import type { FuelRecord, FuelRequest, PageResponse } from '../types';
import { api, cleanParams } from './api';

export interface FuelQuery {
  q?: string;
  vehicleId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const fuelService = {
  list: (query: FuelQuery = {}) =>
    api.get<PageResponse<FuelRecord>>('/fuel', { params: cleanParams(query) }).then((r) => r.data),
  create: (body: FuelRequest) => api.post<FuelRecord>('/fuel', body).then((r) => r.data),
  update: (id: number, body: FuelRequest) => api.put<FuelRecord>(`/fuel/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/fuel/${id}`).then(() => undefined),
};
