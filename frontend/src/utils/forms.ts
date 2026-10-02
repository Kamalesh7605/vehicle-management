import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ApiError, getErrorMessage } from '../services/api';

/**
 * Maps an API error onto a react-hook-form: server-side field errors are attached to their inputs, known
 * business error codes are attached to a specific field, and everything else becomes a banner message.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  setFormError: (message: string | null) => void,
  fieldByCode: Record<string, FieldPath<T>> = {},
): void {
  if (error instanceof ApiError) {
    const codeField = fieldByCode[error.code];
    if (codeField) {
      setError(codeField, { type: 'server', message: error.message });
      setFormError(null);
      return;
    }
    const fields = Object.entries(error.fieldErrors);
    fields.forEach(([field, message]) => setError(field as FieldPath<T>, { type: 'server', message }));
    setFormError(error.message);
    return;
  }
  setFormError(getErrorMessage(error));
}
