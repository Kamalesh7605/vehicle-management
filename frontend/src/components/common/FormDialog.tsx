import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { FormEventHandler, ReactNode } from 'react';
import { LoadingButton } from './LoadingButton';

interface Props {
  open: boolean;
  title: string;
  submitLabel?: string;
  submitting?: boolean;
  error?: string | null;
  maxWidth?: 'xs' | 'sm' | 'md';
  onSubmit: FormEventHandler<HTMLFormElement>;
  onClose: () => void;
  children: ReactNode;
}

/** Modal wrapper for create/edit forms: title, API error banner, Cancel + Save buttons. */
export function FormDialog({
  open,
  title,
  submitLabel = 'Save',
  submitting = false,
  error,
  maxWidth = 'sm',
  onSubmit,
  onClose,
  children,
}: Props) {
  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth={maxWidth} fullWidth>
      <Box component="form" onSubmit={onSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {children}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={submitting}>
            {submitLabel}
          </LoadingButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
