import { Chip, type ChipProps } from '@mui/material';
import {
  DOCUMENT_STATUS_LABELS,
  DRIVER_STATUS_LABELS,
  VEHICLE_STATUS_LABELS,
} from '../../utils/labels';

type Tone = 'success' | 'warning' | 'error' | 'info' | 'default';

const TONES: Record<string, Tone> = {
  ACTIVE: 'success',
  VALID: 'success',
  AVAILABLE: 'info',
  MAINTENANCE: 'warning',
  EXPIRING_SOON: 'warning',
  INACTIVE: 'error',
  EXPIRED: 'error',
};

const LABELS: Record<string, string> = {
  ...DRIVER_STATUS_LABELS,
  ...VEHICLE_STATUS_LABELS,
  ...DOCUMENT_STATUS_LABELS,
};

interface Props {
  status: string;
  label?: string;
  size?: ChipProps['size'];
}

/** Coloured pill for any vehicle / driver / document status value. */
export function StatusChip({ status, label, size = 'small' }: Props) {
  const tone = TONES[status] ?? 'default';
  return (
    <Chip
      size={size}
      label={label ?? LABELS[status] ?? status}
      color={tone}
      variant="filled"
      sx={
        tone === 'default'
          ? undefined
          : { bgcolor: `${tone}.light`, color: `${tone}.dark`, '& .MuiChip-label': { px: 1.25 } }
      }
    />
  );
}
