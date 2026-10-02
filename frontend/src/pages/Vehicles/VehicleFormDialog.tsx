import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormDialog } from '../../components/common/FormDialog';
import { FormGrid, FormSelect, FormTextField, FullWidth } from '../../components/common/FormFields';
import { useNotify } from '../../hooks/useNotify';
import { vehicleService } from '../../services/vehicleService';
import type { FuelType, Vehicle, VehicleStatus } from '../../types';
import { applyApiError } from '../../utils/forms';
import { FUEL_TYPE_OPTIONS, VEHICLE_STATUS_OPTIONS } from '../../utils/labels';
import { optionalDate, optionalNumber, optionalText, requiredText, toNumber, toText } from '../../utils/validation';

export const vehicleSchema = z.object({
  vehicleNumber: requiredText('Vehicle number is required', 30),
  vehicleType: optionalText(50),
  manufacturer: optionalText(100),
  model: optionalText(100),
  manufacturingYear: optionalNumber('Year', { min: 1950, integer: true }),
  fuelType: z.string().min(1, 'Fuel type is required'),
  registrationDate: optionalDate,
  currentOdometer: optionalNumber('Odometer', { min: 0 }),
  status: z.string().min(1),
});

type FormValues = z.infer<typeof vehicleSchema>;

const EMPTY: FormValues = {
  vehicleNumber: '',
  vehicleType: '',
  manufacturer: '',
  model: '',
  manufacturingYear: '',
  fuelType: 'DIESEL',
  registrationDate: '',
  currentOdometer: '0',
  status: 'ACTIVE',
};

function toFormValues(v: Vehicle): FormValues {
  return {
    vehicleNumber: v.vehicleNumber,
    vehicleType: v.vehicleType ?? '',
    manufacturer: v.manufacturer ?? '',
    model: v.model ?? '',
    manufacturingYear: v.manufacturingYear?.toString() ?? '',
    fuelType: v.fuelType,
    registrationDate: v.registrationDate ?? '',
    currentOdometer: String(v.currentOdometer),
    status: v.status,
  };
}

interface Props {
  open: boolean;
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSaved: () => void;
}

export function VehicleFormDialog({ open, vehicle, onClose, onSaved }: Props) {
  const notify = useNotify();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(vehicleSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) {
      reset(vehicle ? toFormValues(vehicle) : EMPTY);
      setFormError(null);
    }
  }, [open, vehicle, reset]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      vehicleNumber: values.vehicleNumber.trim(),
      vehicleType: toText(values.vehicleType),
      manufacturer: toText(values.manufacturer),
      model: toText(values.model),
      manufacturingYear: toNumber(values.manufacturingYear),
      fuelType: values.fuelType as FuelType,
      registrationDate: toText(values.registrationDate),
      currentOdometer: toNumber(values.currentOdometer),
      status: values.status as VehicleStatus,
    };
    try {
      if (vehicle) await vehicleService.update(vehicle.id, body);
      else await vehicleService.create(body);
      notify.success(vehicle ? 'Vehicle updated' : 'Vehicle added');
      onSaved();
      onClose();
    } catch (e) {
      applyApiError(e, setError, setFormError, {
        VEHICLE_ALREADY_EXISTS: 'vehicleNumber',
        ODOMETER_CANNOT_DECREASE: 'currentOdometer',
      });
    }
  });

  return (
    <FormDialog
      open={open}
      title={vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      submitting={isSubmitting}
      error={formError}
      onSubmit={submit}
      onClose={onClose}
    >
      <FormGrid>
        <FullWidth>
          <FormTextField control={control} name="vehicleNumber" label="Vehicle Number" required />
        </FullWidth>
        <FormTextField control={control} name="vehicleType" label="Vehicle Type" />
        <FormTextField control={control} name="manufacturer" label="Manufacturer" />
        <FormTextField control={control} name="model" label="Model" />
        <FormTextField control={control} name="manufacturingYear" label="Manufacturing Year" type="number" />
        <FormSelect control={control} name="fuelType" label="Fuel Type" required options={FUEL_TYPE_OPTIONS} />
        <FormTextField control={control} name="registrationDate" label="Registration Date" type="date" />
        <FormTextField
          control={control}
          name="currentOdometer"
          label="Current Odometer (KM)"
          type="number"
          helperText={vehicle ? 'Cannot be lower than the current reading' : undefined}
        />
        <FormSelect control={control} name="status" label="Status" options={VEHICLE_STATUS_OPTIONS} />
      </FormGrid>
    </FormDialog>
  );
}
