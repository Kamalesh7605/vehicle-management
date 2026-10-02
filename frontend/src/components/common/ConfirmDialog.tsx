import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { LoadingButton } from './LoadingButton';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  destructive = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
