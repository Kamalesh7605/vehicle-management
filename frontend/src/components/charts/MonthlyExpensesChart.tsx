import { Box, Stack, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyExpense } from '../../types';
import { brand } from '../../theme/theme';
import { formatCurrency } from '../../utils/format';

const SERIES = [
  { key: 'fuel', label: 'Fuel', color: brand.fuel },
  { key: 'maintenance', label: 'Maintenance', color: brand.maintenance },
  { key: 'other', label: 'Other', color: brand.other },
] as const;

function compact(value: number): string {
  return value >= 1000 ? `${Math.round(value / 1000)}K` : String(value);
}

export function MonthlyExpensesChart({ data }: { data: MonthlyExpense[] }) {
  return (
    <Box>
      <Box sx={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E5E9F2" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748B', fontSize: 12 }}
              tickFormatter={compact}
              width={44}
            />
            <Tooltip
              cursor={{ fill: 'rgba(37,99,235,.06)' }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
            {SERIES.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="expenses"
                fill={s.color}
                radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 1 }}>
        {SERIES.map((s) => (
          <Stack key={s.key} direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
            <Typography variant="body2" color="text.secondary">
              {s.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
