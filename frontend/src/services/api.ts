import axios, { AxiosError } from 'axios';
import { authStorage, UNAUTHORIZED_EVENT } from '../utils/authStorage';

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

interface ErrorBody {
  message?: string;
  code?: string;
  errors?: Record<string, string>;
}

/** Normalised error thrown by every service call. */
export class ApiError extends Error {
  readonly status: number | undefined;
  readonly code: string;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number | undefined, code: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorBody>) => {
    if (error.response) {
      const body = error.response.data;
      // An expired or missing session anywhere in the app sends the user back to the login page.
      if (error.response.status === 401 && !error.config?.url?.includes('/auth/login')) {
        authStorage.clear();
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
      return Promise.reject(
        new ApiError(
          body?.message ?? `Request failed (${error.response.status})`,
          error.response.status,
          body?.code ?? 'UNKNOWN_ERROR',
          body?.errors ?? {},
        ),
      );
    }
    const message =
      error.code === 'ECONNABORTED'
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the server. Check your connection and try again.';
    return Promise.reject(new ApiError(message, undefined, 'NETWORK_ERROR'));
  },
);

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

/** Drops empty values so they are not sent as "?q=&status=". */
export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<T>;
}
