import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, Typography } from '@mui/material';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <Box role="alert" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 6, px: 2 }}>
      <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
      <Typography fontWeight={600}>Something went wrong</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </Box>
  );
}
