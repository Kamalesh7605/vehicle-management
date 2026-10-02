import { Box, MenuItem, TextField } from '@mui/material';
import { PRESET_LABELS, presetRange, type DatePreset, type DateRange } from '../../utils/dates';

interface Props {
  preset: DatePreset;
  range: DateRange;
  onChange: (preset: DatePreset, range: DateRange) => void;
  allowCustom?: boolean;
}

/** Preset date-range dropdown; optionally reveals From/To inputs for a custom range. */
export function DateRangeFilter({ preset, range, onChange, allowCustom = false }: Props) {
  const presets = (Object.keys(PRESET_LABELS) as DatePreset[]).filter((p) => allowCustom || p !== 'CUSTOM');

  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        select
        label="Period"
        value={preset}
        onChange={(e) => {
          const next = e.target.value as DatePreset;
          onChange(next, next === 'CUSTOM' ? range : presetRange(next));
        }}
        sx={{ minWidth: 160, bgcolor: 'background.paper' }}
      >
        {presets.map((p) => (
          <MenuItem key={p} value={p}>
            {PRESET_LABELS[p]}
          </MenuItem>
        ))}
      </TextField>
      {allowCustom && preset === 'CUSTOM' && (
        <>
          <TextField
            type="date"
            label="From"
            value={range.from}
            onChange={(e) => onChange('CUSTOM', { ...range, from: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160, bgcolor: 'background.paper' }}
          />
          <TextField
            type="date"
            label="To"
            value={range.to}
            onChange={(e) => onChange('CUSTOM', { ...range, to: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160, bgcolor: 'background.paper' }}
          />
        </>
      )}
    </Box>
  );
}
