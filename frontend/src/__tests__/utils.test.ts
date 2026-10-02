import { toCsv } from '../utils/csv';
import { presetRange, toIsoDate } from '../utils/dates';
import { formatCurrency, formatDate, formatDaysRemaining, formatKm } from '../utils/format';
import { optionalNumber, requiredNumber } from '../utils/validation';

describe('formatting', () => {
  it('formats rupees and dashes for missing values', () => {
    expect(formatCurrency(32500)).toBe('₹32,500');
    expect(formatCurrency(1234.5)).toBe('₹1,234.50');
    expect(formatCurrency(142247.1)).toBe('₹1,42,247.10');
    expect(formatCurrency(null)).toBe('-');
  });

  it('formats ISO dates without timezone shifts', () => {
    expect(formatDate('2024-09-29')).toBe('29 Sep 2024');
    expect(formatDate('2026-01-01')).toBe('01 Jan 2026');
    expect(formatDate(null)).toBe('-');
  });

  it('formats kilometres', () => {
    expect(formatKm(245320)).toBe('245,320 KM');
  });

  it('describes days remaining', () => {
    expect(formatDaysRemaining(16)).toBe('16 days remaining');
    expect(formatDaysRemaining(1)).toBe('1 day remaining');
    expect(formatDaysRemaining(0)).toBe('Expires today');
    expect(formatDaysRemaining(-3)).toBe('Expired 3 days ago');
  });
});

describe('date presets', () => {
  const now = new Date(2026, 8, 29); // 29 Sep 2026

  it('computes this month, last month and this year', () => {
    expect(presetRange('THIS_MONTH', now)).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(presetRange('LAST_MONTH', now)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
    expect(presetRange('LAST_3_MONTHS', now)).toEqual({ from: '2026-07-01', to: '2026-09-30' });
    expect(presetRange('THIS_YEAR', now)).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });

  it('handles January for last month', () => {
    expect(presetRange('LAST_MONTH', new Date(2026, 0, 15))).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('formats local dates', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('csv', () => {
  it('escapes commas, quotes and newlines', () => {
    const csv = toCsv(['Name', 'Note'], [['Kumar, R', 'said "hi"'], ['Raj', null]]);
    expect(csv).toBe('Name,Note\r\n"Kumar, R","said ""hi"""\r\nRaj,');
  });
});

describe('number validators', () => {
  it('optionalNumber accepts empty and rejects junk / below minimum', () => {
    const schema = optionalNumber('Odometer', { min: 0 });
    expect(schema.safeParse('').success).toBe(true);
    expect(schema.safeParse('120.5').success).toBe(true);
    expect(schema.safeParse('abc').success).toBe(false);
    expect(schema.safeParse('-1').success).toBe(false);
  });

  it('requiredNumber enforces presence and exclusive minimum', () => {
    const schema = requiredNumber('Quantity', { exclusiveMin: 0 });
    expect(schema.safeParse('').success).toBe(false);
    expect(schema.safeParse('0').success).toBe(false);
    expect(schema.safeParse('12').success).toBe(true);
  });
});
