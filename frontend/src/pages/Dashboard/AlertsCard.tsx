import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';
import type { Alert } from '../../types';

function iconFor(alert: Alert): ReactNode {
  if (alert.type.startsWith('SERVICE')) return <BuildOutlinedIcon />;
  if (alert.severity === 'DANGER') return <DescriptionOutlinedIcon />;
  return <WarningAmberIcon />;
}

interface Props {
  alerts: Alert[] | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AlertsCard({ alerts, loading, error, onRetry }: Props) {
  const navigate = useNavigate();

  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading && !alerts) return <LoadingState />;
  if (!alerts || alerts.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircleOutlineIcon color="success" sx={{ fontSize: 44 }} />}
        title="All clear"
        message="No expiring documents or services due."
      />
    );
  }

  return (
    <Stack spacing={1} sx={{ maxHeight: 290, overflowY: 'auto', pr: 0.5 }}>
      {alerts.map((alert) => {
        const danger = alert.severity === 'DANGER';
        return (
          <Box
            key={alert.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(alert.link)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(alert.link)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.25,
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: danger ? 'error.light' : 'warning.light',
              color: danger ? 'error.dark' : 'warning.dark',
              '&:hover': { filter: 'brightness(.97)' },
            }}
          >
            {iconFor(alert)}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography fontWeight={600} fontSize={14}>
                {alert.title}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {alert.subject}
              </Typography>
            </Box>
            <ChevronRightIcon fontSize="small" />
          </Box>
        );
      })}
    </Stack>
  );
}
