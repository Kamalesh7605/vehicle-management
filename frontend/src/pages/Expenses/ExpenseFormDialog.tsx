import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormDialog } from '../../components/common/FormDialog';
import { FormGrid, FormSelect, FormTextField, FullWidth } from '../../components/common/FormFields';
import { useNotify } from '../../hooks/useNotify';
import { expenseService } from '../../services/expenseService';
import type { Expense, ExpenseCategory } from '../../types';
import { todayIso } from '../../utils/dates';
import { applyApiError } from '../../utils/forms';
import { EXPENSE_CATEGORY_OPTIONS, type Option } from '../../utils/labels';
import { optionalText, requiredDate, requiredNumber, toText } from '../../utils/validation';

export const expenseSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  date: requiredDate('Date is required'),
  category: z.string().min(1, 'Category is required'),
  amount: requiredNumber('Amount', { exclusiveMin: 0 }),
  description: optionalText(300),
  notes: optionalText(500),
});

type FormValues = z.infer<typeof expenseSchema>;

function emptyValues(vehicleId?: number): FormValues {
  return {
    vehicleId: vehicleId ? String(vehicleId) : '',
    date: todayIso(),
    category: 'TOLL',
    amount: '',
    description: '',
    notes: '',
  };
}

function toFormValues(e: Expense): FormValues {
  return {
    vehicleId: String(e.vehicleId),
    date: e.date,
    category: e.category,
    amount: String(e.amount),
    description: e.description ?? '',
    notes: e.notes ?? '',
  };
}

interface Props {
  open: boolean;
  record?: Expense | null;
  defaultVehicleId?: number;
  vehicleOptions: Option[];
  onClose: () => void;
  onSaved: () => void;
}

export function ExpenseFormDialog({ open, record, defaultVehicleId, vehicleOptions, onClose, onSaved }: Props) {
  const notify = useNotify();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(expenseSchema), defaultValues: emptyValues(defaultVehicleId) });

  useEffect(() => {
    if (open) {
      reset(record ? toFormValues(record) : emptyValues(defaultVehicleId));
      setFormError(null);
    }
  }, [open, record, defaultVehicleId, reset]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      vehicleId: Number(values.vehicleId),
      date: values.date,
      category: values.category as ExpenseCategory,
      amount: Number(values.amount),
      description: toText(values.description),
      notes: toText(values.notes),
    };
    try {
      if (record) await expenseService.update(record.id, body);
      else await expenseService.create(body);
      notify.success(record ? 'Expense updated' : 'Expense added');
      onSaved();
      onClose();
    } catch (e) {
      applyApiError(e, setError, setFormError);
    }
  });

  return (
    <FormDialog
      open={open}
      title={record ? 'Edit Expense' : 'Add Expense'}
      submitting={isSubmitting}
      error={formError}
      onSubmit={submit}
      onClose={onClose}
    >
      <FormGrid>
        <FormSelect control={control} name="vehicleId" label="Vehicle" required options={vehicleOptions} disabled={!!defaultVehicleId && !record} />
        <FormTextField control={control} name="date" label="Date" type="date" required />
        <FormSelect control={control} name="category" label="Category" required options={EXPENSE_CATEGORY_OPTIONS} />
        <FormTextField control={control} name="amount" label="Amount (₹)" type="number" required />
        <FullWidth>
          <FormTextField control={control} name="description" label="Description" />
        </FullWidth>
        <FullWidth>
          <FormTextField control={control} name="notes" label="Notes" multiline />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}
