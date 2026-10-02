import { Box, Stack, Typography } from '@mui/material';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { brand } from '../../theme/theme';
import type { ExpenseBreakdown } from '../../types';
import { formatCurrency } from '../../utils/format';

const COLORS: Record<string, string> = {
  FUEL: brand.fuel,
  MAINTENANCE: brand.maintenance,
  OTHER: brand.other,
};

export function ExpenseBreakdownChart({ data }: { data: ExpenseBreakdown }) {
  const hasData = data.total > 0;
  const slices = hasData ? data.items : [{ key: 'NONE', name: 'No expenses', amount: 1, percentage: 0 }];

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" flexWrap="wrap" useFlexGap spacing={2} sx={{ rowGap: 2 }}>
      <Box sx={{ position: 'relative', width: 170, height: 170, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="name"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={hasData ? 2 : 0}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {slices.map((s) => (
                <Cell key={s.key} fill={COLORS[s.key] ?? '#E5E9F2'} />
              ))}
            </Pie>
            {hasData && <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} />}
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography fontWeight={700} fontSize={17}>
            {formatCurrency(Math.round(data.total))}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total
          </Typography>
        </Box>
      </Box>

      <Stack spacing={1.5} sx={{ minWidth: 150 }}>
        {data.items.map((item) => (
          <Stack key={item.key} direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[item.key] }} />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {item.name}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {item.percentage.toFixed(1)}%
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
