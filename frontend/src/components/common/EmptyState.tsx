import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Box, Button, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  title?: string;
  message?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({
  title = 'Nothing here yet',
  message = 'No records found.',
  icon,
  actionLabel,
  onAction,
  children,
}: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 6, px: 2, color: 'text.secondary' }}>
      {icon ?? <InboxOutlinedIcon sx={{ fontSize: 44, opacity: 0.6 }} />}
      <Typography fontWeight={600} color="text.primary">
        {title}
      </Typography>
      <Typography variant="body2" textAlign="center">
        {message}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
      {children}
    </Box>
  );
}
