import { Box, CircularProgress, Typography } from '@mui/material';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <Box
      role="status"
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 6, color: 'text.secondary' }}
    >
      <CircularProgress size={28} />
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}
