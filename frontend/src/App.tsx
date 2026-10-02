import { CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { NotifyProvider } from './hooks/useNotify';
import { AppRoutes } from './routes';
import { theme } from './theme/theme';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotifyProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </NotifyProvider>
    </ThemeProvider>
  );
}
