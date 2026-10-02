import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormDialog } from '../../components/common/FormDialog';
import { FormCheckbox, FormGrid, FormSelect, FormTextField, FullWidth } from '../../components/common/FormFields';
import { useNotify } from '../../hooks/useNotify';
import { fuelService } from '../../services/fuelService';
import type { FuelRecord, FuelType, Vehicle } from '../../types';
import { todayIso } from '../../utils/dates';
import { applyApiError } from '../../utils/forms';
import { FUEL_TYPE_OPTIONS, type Option } from '../../utils/labels';
import {
  optionalNumber,
  optionalText,
  requiredDate,
  requiredNumber,
  toNumber,
  toText,
} from '../../utils/validation';

export const fuelSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  date: requiredDate('Date is required'),
  fuelType: z.string(),
  quantity: requiredNumber('Quantity', { exclusiveMin: 0 }),
  pricePerLitre: requiredNumber('Price per litre', { min: 0 }),
  totalAmount: optionalNumber('Total amount', { min: 0 }),
  odometer: optionalNumber('Odometer', { min: 0 }),
  fuelStation: optionalText(150),
  notes: optionalText(500),
  allowInactive: z.boolean(),
});

type FormValues = z.infer<typeof fuelSchema>;

/** Total = quantity x price per litre, rounded to 2 decimals. Empty when either input is not a number. */
export function calculateFuelTotal(quantity: string, price: string): string {
  const q = Number(quantity);
  const p = Number(price);
  if (quantity.trim() === '' || price.trim() === '' || Number.isNaN(q) || Number.isNaN(p)) return '';
  return (Math.round(q * p * 100) / 100).toFixed(2);
}

function emptyValues(vehicleId?: number): FormValues {
  return {
    vehicleId: vehicleId ? String(vehicleId) : '',
    date: todayIso(),
    fuelType: '',
    quantity: '',
    pricePerLitre: '',
    totalAmount: '',
    odometer: '',
    fuelStation: '',
    notes: '',
    allowInactive: false,
  };
}

function toFormValues(r: FuelRecord): FormValues {
  return {
    vehicleId: String(r.vehicleId),
    date: r.date,
    fuelType: r.fuelType ?? '',
    quantity: String(r.quantity),
    pricePerLitre: String(r.pricePerLitre),
    totalAmount: String(r.totalAmount),
    odometer: r.odometer?.toString() ?? '',
    fuelStation: r.fuelStation ?? '',
    notes: r.notes ?? '',
    allowInactive: false,
  };
}

interface Props {
  open: boolean;
  record?: FuelRecord | null;
  defaultVehicleId?: number;
  vehicles: Vehicle[];
  vehicleOptions: Option[];
  onClose: () => void;
  onSaved: () => void;
}

export function FuelFormDialog({ open, record, defaultVehicleId, vehicles, vehicleOptions, onClose, onSaved }: Props) {
  const notify = useNotify();
  const [formError, setFormError] = useState<string | null>(null);
  const totalEditedManually = useRef(false);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(fuelSchema), defaultValues: emptyValues(defaultVehicleId) });

  useEffect(() => {
    if (open) {
      reset(record ? toFormValues(record) : emptyValues(defaultVehicleId));
      totalEditedManually.current = record
        ? calculateFuelTotal(String(record.quantity), String(record.pricePerLitre)) !== record.totalAmount.toFixed(2)
        : false;
      setFormError(null);
    }
  }, [open, record, defaultVehicleId, reset]);

  const quantity = watch('quantity');
  const price = watch('pricePerLitre');
  useEffect(() => {
    if (!open || totalEditedManually.current) return;
    setValue('totalAmount', calculateFuelTotal(quantity, price));
  }, [open, quantity, price, setValue]);

  const selectedVehicle = vehicles.find((v) => String(v.id) === watch('vehicleId'));
  const showInactiveToggle = selectedVehicle?.status === 'INACTIVE';

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      vehicleId: Number(values.vehicleId),
      date: values.date,
      fuelType: (toText(values.fuelType) as FuelType | undefined),
      quantity: Number(values.quantity),
      pricePerLitre: Number(values.pricePerLitre),
      totalAmount: toNumber(values.totalAmount),
      odometer: toNumber(values.odometer),
      fuelStation: toText(values.fuelStation),
      notes: toText(values.notes),
      allowInactive: values.allowInactive || undefined,
    };
    try {
      if (record) await fuelService.update(record.id, body);
      else await fuelService.create(body);
      notify.success(record ? 'Fuel record updated' : 'Fuel record added');
      onSaved();
      onClose();
    } catch (e) {
      applyApiError(e, setError, setFormError);
    }
  });

  return (
    <FormDialog
      open={open}
      title={record ? 'Edit Fuel Record' : 'Add Fuel Record'}
      submitting={isSubmitting}
      error={formError}
      onSubmit={submit}
      onClose={onClose}
    >
      <FormGrid>
        <FormSelect control={control} name="vehicleId" label="Vehicle" required options={vehicleOptions} disabled={!!defaultVehicleId && !record} />
        <FormTextField control={control} name="date" label="Date" type="date" required />
        <FormSelect control={control} name="fuelType" label="Fuel Type" options={FUEL_TYPE_OPTIONS} allowEmpty emptyLabel="Same as vehicle" />
        <FormTextField control={control} name="odometer" label="Odometer (KM)" type="number" helperText={selectedVehicle ? `Vehicle is at ${selectedVehicle.currentOdometer.toLocaleString()} KM` : undefined} />
        <FormTextField control={control} name="quantity" label="Quantity (Litres)" type="number" required />
        <FormTextField control={control} name="pricePerLitre" label="Price Per Litre (₹)" type="number" required />
        <FormTextField
          control={control}
          name="totalAmount"
          label="Total Amount (₹)"
          type="number"
          helperText="Calculated as quantity × price. Edit to override."
          onValueChange={() => {
            totalEditedManually.current = true;
          }}
        />
        <FormTextField control={control} name="fuelStation" label="Fuel Station" />
        <FullWidth>
          <FormTextField control={control} name="notes" label="Notes" multiline />
        </FullWidth>
        {showInactiveToggle && (
          <FullWidth>
            <FormCheckbox control={control} name="allowInactive" label="This vehicle is inactive - add the record anyway" />
          </FullWidth>
        )}
      </FormGrid>
    </FormDialog>
  );
}
