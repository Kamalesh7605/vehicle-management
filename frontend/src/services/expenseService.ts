import type { Expense, ExpenseCategory, ExpenseRequest, PageResponse } from '../types';
import { api, cleanParams } from './api';

export interface ExpenseQuery {
  q?: string;
  vehicleId?: number;
  category?: ExpenseCategory;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export const expenseService = {
  list: (query: ExpenseQuery = {}) =>
    api.get<PageResponse<Expense>>('/expenses', { params: cleanParams(query) }).then((r) => r.data),
  create: (body: ExpenseRequest) => api.post<Expense>('/expenses', body).then((r) => r.data),
  update: (id: number, body: ExpenseRequest) => api.put<Expense>(`/expenses/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/expenses/${id}`).then(() => undefined),
};
