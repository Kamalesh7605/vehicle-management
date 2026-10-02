const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const fraction = Number.isInteger(value) ? 0 : 2;
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: fraction, maximumFractionDigits: fraction })}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatKm(value: number | null | undefined): string {
  return value === null || value === undefined ? '-' : `${formatNumber(value)} KM`;
}

/** Formats an ISO date (yyyy-mm-dd) as "29 Sep 2024" without any timezone conversion. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return iso;
  return `${String(day).padStart(2, '0')} ${MONTHS[month - 1]} ${year}`;
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) return `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`;
  if (days === 0) return 'Expires today';
  return `${days} ${days === 1 ? 'day' : 'days'} remaining`;
}
