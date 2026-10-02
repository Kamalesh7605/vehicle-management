import { MenuItem, TextField } from '@mui/material';
import type { Option } from '../../utils/labels';

interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  allLabel?: string;
  minWidth?: number;
}

/** Dropdown filter with an "All" entry that maps to the empty string. */
export function FilterSelect({ label, value, options, onChange, allLabel = 'All', minWidth = 150 }: Props) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth, width: { xs: '100%', sm: 'auto' }, bgcolor: 'background.paper' }}
    >
      <MenuItem value="">{allLabel}</MenuItem>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
