import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '../components/layout/RequireAuth';
import { AuthProvider } from '../hooks/useAuth';
import { LoginPage } from '../pages/Login/LoginPage';
import { api, ApiError } from '../services/api';
import { authService } from '../services/authService';
import { authStorage, UNAUTHORIZED_EVENT } from '../utils/authStorage';

vi.mock('../services/authService', () => ({ authService: { login: vi.fn() } }));

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/vehicles" element={<RequireAuth><div>Vehicles page</div></RequireAuth>} />
          <Route path="/" element={<RequireAuth><div>Dashboard page</div></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authStorage.clear();
  vi.clearAllMocks();
});

describe('route guard', () => {
  it('redirects visitors without a session to the login page', () => {
    renderApp('/vehicles');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByText('Vehicles page')).not.toBeInTheDocument();
  });

  it('lets signed-in users through', () => {
    authStorage.save('tok', 'admin');
    renderApp('/vehicles');
    expect(screen.getByText('Vehicles page')).toBeInTheDocument();
  });

  it('signs the user out when the API reports an expired session', async () => {
    authStorage.save('tok', 'admin');
    renderApp('/vehicles');
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(authStorage.getToken()).toBeNull();
  });
});

describe('login page', () => {
  it('requires a username and password before calling the API', async () => {
    renderApp('/login');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('shows the API error for wrong credentials and stays on the page', async () => {
    vi.mocked(authService.login).mockRejectedValue(new ApiError('Invalid username or password', 401, 'INVALID_CREDENTIALS'));
    renderApp('/login');
    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/^password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument();
    expect(authStorage.getToken()).toBeNull();
  });

  it('stores the token and returns to the page the user asked for', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: 'abc', username: 'admin', expiresInSeconds: 3600 });
    renderApp('/vehicles');
    await userEvent.type(screen.getByLabelText(/username/i), 'admin');
    await userEvent.type(screen.getByLabelText(/^password/i), 'admin');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Vehicles page')).toBeInTheDocument();
    expect(authStorage.getToken()).toBe('abc');
    expect(authService.login).toHaveBeenCalledWith('admin', 'admin');
  });
});

describe('api client', () => {
  it('attaches the bearer token to requests', async () => {
    authStorage.save('my-token', 'admin');
    let seen: string | undefined;
    await api.get('/vehicles', {
      adapter: async (config) => {
        seen = String(config.headers.get('Authorization'));
        return { data: [], status: 200, statusText: 'OK', headers: {}, config };
      },
    });
    expect(seen).toBe('Bearer my-token');
  });

  it('clears the session and notifies the app on a 401', async () => {
    authStorage.save('old', 'admin');
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    await expect(
      api.get('/vehicles', {
        adapter: async (config) =>
          Promise.reject(
            Object.assign(new Error('401'), {
              isAxiosError: true,
              config,
              response: { status: 401, data: { message: 'expired', code: 'UNAUTHORIZED' }, config },
            }),
          ),
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await waitFor(() => expect(listener).toHaveBeenCalled());
    expect(authStorage.getToken()).toBeNull();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });
});
