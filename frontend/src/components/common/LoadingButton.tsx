import { Button, CircularProgress, type ButtonProps } from '@mui/material';

interface Props extends ButtonProps {
  loading?: boolean;
}

/** Button that shows a spinner and disables itself while `loading`. */
export function LoadingButton({ loading = false, disabled, children, ...rest }: Props) {
  return (
    <Button
      {...rest}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : rest.startIcon}
    >
      {children}
    </Button>
  );
}
