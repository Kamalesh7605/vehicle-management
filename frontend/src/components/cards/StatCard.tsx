import { Box, Card, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: string;
  caption?: ReactNode;
  icon: ReactNode;
  /** Background tint of the icon tile, e.g. '#DBEAFE'. */
  tint: string;
  /** Foreground colour of the icon. */
  color: string;
}

export function StatCard({ title, value, caption, icon, tint, color }: Props) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2.5,
            bgcolor: tint,
            color,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            '& svg': { fontSize: 30 },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            {title}
          </Typography>
          <Typography variant="h5" sx={{ lineHeight: 1.3 }}>
            {value}
          </Typography>
          {caption && (
            <Typography variant="caption" color="text.secondary" component="div">
              {caption}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}
