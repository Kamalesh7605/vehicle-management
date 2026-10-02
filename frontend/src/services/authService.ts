import { api } from './api';

export interface LoginResult {
  token: string;
  username: string;
  expiresInSeconds: number;
}

export const authService = {
  login: (username: string, password: string) =>
    api.post<LoginResult>('/auth/login', { username, password }).then((r) => r.data),
};
