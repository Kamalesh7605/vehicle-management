export type DatePreset = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'CUSTOM';

export interface DateRange {
  from: string;
  to: string;
}

/** Local-time yyyy-mm-dd (toISOString would shift the date for timezones ahead of UTC). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export const PRESET_LABELS: Record<DatePreset, string> = {
  THIS_MONTH: 'This Month',
  LAST_MONTH: 'Last Month',
  LAST_3_MONTHS: 'Last 3 Months',
  THIS_YEAR: 'This Year',
  CUSTOM: 'Custom Range',
};

export function presetRange(preset: DatePreset, now: Date = new Date()): DateRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case 'LAST_MONTH':
      return { from: toIsoDate(new Date(y, m - 1, 1)), to: toIsoDate(new Date(y, m, 0)) };
    case 'LAST_3_MONTHS':
      return { from: toIsoDate(new Date(y, m - 2, 1)), to: toIsoDate(new Date(y, m + 1, 0)) };
    case 'THIS_YEAR':
      return { from: toIsoDate(new Date(y, 0, 1)), to: toIsoDate(new Date(y, 11, 31)) };
    case 'THIS_MONTH':
    default:
      return { from: toIsoDate(new Date(y, m, 1)), to: toIsoDate(new Date(y, m + 1, 0)) };
  }
}
