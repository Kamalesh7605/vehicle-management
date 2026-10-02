import { z } from 'zod';

/** Form inputs are strings; numbers are validated here and converted with toNumber() on submit. */
export const requiredText = (message: string, max = 200) =>
  z.string().trim().min(1, message).max(max, `Maximum ${max} characters`);

export const optionalText = (max = 500) => z.string().trim().max(max, `Maximum ${max} characters`);

export const requiredDate = (message: string) => z.string().min(1, message);

export const optionalDate = z.string();

export function optionalNumber(label: string, options: { min?: number; integer?: boolean } = {}) {
  return z.string().refine(
    (value) => {
      const trimmed = value.trim();
      if (trimmed === '') return true;
      const n = Number(trimmed);
      if (Number.isNaN(n)) return false;
      if (options.integer && !Number.isInteger(n)) return false;
      return options.min === undefined || n >= options.min;
    },
    options.integer
      ? `${label} must be a whole number${options.min !== undefined ? ` (min ${options.min})` : ''}`
      : `${label} must be a valid number${options.min !== undefined ? ` (min ${options.min})` : ''}`,
  );
}

export function requiredNumber(label: string, options: { min?: number; exclusiveMin?: number } = {}) {
  return z.string().refine((value) => value.trim() !== '', `${label} is required`).refine(
    (value) => value.trim() === '' || !Number.isNaN(Number(value)),
    `${label} must be a valid number`,
  ).refine(
    (value) => {
      if (value.trim() === '' || Number.isNaN(Number(value))) return true;
      const n = Number(value);
      if (options.exclusiveMin !== undefined) return n > options.exclusiveMin;
      return options.min === undefined || n >= options.min;
    },
    options.exclusiveMin !== undefined
      ? `${label} must be greater than ${options.exclusiveMin}`
      : `${label} cannot be less than ${options.min}`,
  );
}

/** '' -> undefined, otherwise the number. */
export function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : Number(trimmed);
}

export function toText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export const PHONE_REGEX = /^[+]?[0-9][0-9 -]{6,18}[0-9]$/;
