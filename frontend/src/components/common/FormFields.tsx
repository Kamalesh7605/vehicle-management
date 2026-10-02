import { Checkbox, FormControlLabel, MenuItem, TextField, type TextFieldProps } from '@mui/material';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import type { Option } from '../../utils/labels';

interface BaseProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** Called after react-hook-form has processed the change. */
  onValueChange?: (value: string) => void;
}

interface TextProps<T extends FieldValues> extends BaseProps<T> {
  type?: 'text' | 'number' | 'date' | 'tel';
  multiline?: boolean;
  inputProps?: TextFieldProps['inputProps'];
}

export function FormTextField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  disabled,
  helperText,
  type = 'text',
  multiline,
  inputProps,
  onValueChange,
}: TextProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          onChange={(e) => {
            field.onChange(e);
            onValueChange?.(e.target.value);
          }}
          type={type}
          label={label}
          required={required}
          disabled={disabled}
          multiline={multiline}
          minRows={multiline ? 2 : undefined}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? helperText}
          InputLabelProps={type === 'date' ? { shrink: true } : undefined}
          inputProps={{ ...(type === 'number' ? { step: 'any' } : {}), ...inputProps }}
        />
      )}
    />
  );
}

interface SelectProps<T extends FieldValues> extends BaseProps<T> {
  options: Option[];
  /** Adds an empty first option (for optional selects). */
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  required,
  disabled,
  helperText,
  options,
  allowEmpty,
  emptyLabel = 'None',
  onValueChange,
}: SelectProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          onChange={(e) => {
            field.onChange(e);
            onValueChange?.(e.target.value);
          }}
          select
          label={label}
          required={required}
          disabled={disabled}
          error={!!fieldState.error}
          helperText={fieldState.error?.message ?? helperText}
        >
          {allowEmpty && (
            <MenuItem value="">
              <em>{emptyLabel}</em>
            </MenuItem>
          )}
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

export function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
}: Pick<BaseProps<T>, 'control' | 'name' | 'label'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControlLabel
          control={<Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
          label={label}
        />
      )}
    />
  );
}

/** Two-column responsive grid for form fields. */
export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, pt: 1 }}>
      {children}
    </Box>
  );
}

/** Makes a field span both columns of a FormGrid. */
export function FullWidth({ children }: { children: ReactNode }) {
  return <Box sx={{ gridColumn: { sm: '1 / -1' } }}>{children}</Box>;
}
