import { Box, TextField } from '@mui/material';
import type { ReactNode } from 'react';

/** Wrapping row that holds a list page's search box and filters (and, when embedded, the Add button). */
export function ManagerToolbar({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      {children}
      {action && <Box sx={{ ml: { sm: 'auto' } }}>{action}</Box>}
    </Box>
  );
}

export function DateFilterFields({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <>
      <DateInput label="From" value={from} onChange={onFrom} />
      <DateInput label="To" value={to} onChange={onTo} />
    </>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <TextField
      type="date"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
      sx={{ width: { xs: '100%', sm: 160 }, bgcolor: 'background.paper' }}
    />
  );
}
