export type CsvValue = string | number | null | undefined;

function escapeCell(value: CsvValue): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: CsvValue[][]): void {
  // BOM so Excel opens UTF-8 (₹ etc.) correctly.
  const blob = new Blob(['﻿', toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
