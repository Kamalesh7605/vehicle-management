import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { authStorage, UNAUTHORIZED_EVENT } from '../utils/authStorage';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [username, setUsername] = useState<string | null>(() => authStorage.getUsername());

  const logout = useCallback(() => {
    authStorage.clear();
    setToken(null);
    setUsername(null);
  }, []);

  // The API layer raises this when the server says the session is no longer valid.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const login = useCallback(async (user: string, password: string) => {
    const result = await authService.login(user.trim(), password);
    authStorage.save(result.token, result.username);
    setToken(result.token);
    setUsername(result.username);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ isAuthenticated: !!token, username, login, logout }),
    [token, username, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
