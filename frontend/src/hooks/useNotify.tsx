import { Alert, Snackbar } from '@mui/material';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Notifier {
  success: (message: string) => void;
  error: (message: string) => void;
}

interface Toast {
  message: string;
  severity: 'success' | 'error';
  key: number;
}

const NotifyContext = createContext<Notifier | null>(null);

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((severity: Toast['severity'], message: string) => {
    setToast({ severity, message, key: Date.now() });
    setOpen(true);
  }, []);

  const notifier = useMemo<Notifier>(
    () => ({ success: (m) => show('success', m), error: (m) => show('error', m) }),
    [show],
  );

  return (
    <NotifyContext.Provider value={notifier}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== 'clickaway' && setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={() => setOpen(false)}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}

export function useNotify(): Notifier {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify must be used inside NotifyProvider');
  return ctx;
}
