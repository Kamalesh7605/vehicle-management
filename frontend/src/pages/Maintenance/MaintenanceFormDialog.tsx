import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormDialog } from '../../components/common/FormDialog';
import { FormCheckbox, FormGrid, FormSelect, FormTextField, FullWidth } from '../../components/common/FormFields';
import { useNotify } from '../../hooks/useNotify';
import { maintenanceService } from '../../services/maintenanceService';
import type { MaintenanceRecord, MaintenanceType, Vehicle } from '../../types';
import { todayIso } from '../../utils/dates';
import { applyApiError } from '../../utils/forms';
import { MAINTENANCE_TYPE_OPTIONS, type Option } from '../../utils/labels';
import {
  optionalNumber,
  optionalText,
  requiredDate,
  requiredNumber,
  toNumber,
  toText,
} from '../../utils/validation';

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  date: requiredDate('Date is required'),
  maintenanceType: z.string().min(1, 'Maintenance type is required'),
  description: optionalText(500),
  odometer: optionalNumber('Odometer', { min: 0 }),
  cost: requiredNumber('Cost', { min: 0 }),
  nextServiceKm: optionalNumber('Next service KM', { min: 0 }),
  notes: optionalText(500),
  allowInactive: z.boolean(),
});

type FormValues = z.infer<typeof maintenanceSchema>;

function emptyValues(vehicleId?: number): FormValues {
  return {
    vehicleId: vehicleId ? String(vehicleId) : '',
    date: todayIso(),
    maintenanceType: 'GENERAL_SERVICE',
    description: '',
    odometer: '',
    cost: '',
    nextServiceKm: '',
    notes: '',
    allowInactive: false,
  };
}

function toFormValues(r: MaintenanceRecord): FormValues {
  return {
    vehicleId: String(r.vehicleId),
    date: r.date,
    maintenanceType: r.maintenanceType,
    description: r.description ?? '',
    odometer: r.odometer?.toString() ?? '',
    cost: String(r.cost),
    nextServiceKm: r.nextServiceKm?.toString() ?? '',
    notes: r.notes ?? '',
    allowInactive: false,
  };
}

interface Props {
  open: boolean;
  record?: MaintenanceRecord | null;
  defaultVehicleId?: number;
  vehicles: Vehicle[];
  vehicleOptions: Option[];
  onClose: () => void;
  onSaved: () => void;
}

export function MaintenanceFormDialog({ open, record, defaultVehicleId, vehicles, vehicleOptions, onClose, onSaved }: Props) {
  const notify = useNotify();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(maintenanceSchema), defaultValues: emptyValues(defaultVehicleId) });

  useEffect(() => {
    if (open) {
      reset(record ? toFormValues(record) : emptyValues(defaultVehicleId));
      setFormError(null);
    }
  }, [open, record, defaultVehicleId, reset]);

  const selectedVehicle = vehicles.find((v) => String(v.id) === watch('vehicleId'));
  const nextServiceKm = toNumber(watch('nextServiceKm'));
  const remaining = selectedVehicle && nextServiceKm !== undefined && !Number.isNaN(nextServiceKm)
    ? nextServiceKm - selectedVehicle.currentOdometer
    : undefined;

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      vehicleId: Number(values.vehicleId),
      date: values.date,
      maintenanceType: values.maintenanceType as MaintenanceType,
      description: toText(values.description),
      odometer: toNumber(values.odometer),
      cost: Number(values.cost),
      nextServiceKm: toNumber(values.nextServiceKm),
      notes: toText(values.notes),
      allowInactive: values.allowInactive || undefined,
    };
    try {
      if (record) await maintenanceService.update(record.id, body);
      else await maintenanceService.create(body);
      notify.success(record ? 'Maintenance record updated' : 'Maintenance record added');
      onSaved();
      onClose();
    } catch (e) {
      applyApiError(e, setError, setFormError);
    }
  });

  return (
    <FormDialog
      open={open}
      title={record ? 'Edit Maintenance' : 'Add Maintenance'}
      submitting={isSubmitting}
      error={formError}
      onSubmit={submit}
      onClose={onClose}
    >
      <FormGrid>
        <FormSelect control={control} name="vehicleId" label="Vehicle" required options={vehicleOptions} disabled={!!defaultVehicleId && !record} />
        <FormTextField control={control} name="date" label="Date" type="date" required />
        <FormSelect control={control} name="maintenanceType" label="Maintenance Type" required options={MAINTENANCE_TYPE_OPTIONS} />
        <FormTextField control={control} name="cost" label="Cost (₹)" type="number" required />
        <FormTextField control={control} name="odometer" label="Odometer (KM)" type="number" helperText={selectedVehicle ? `Vehicle is at ${selectedVehicle.currentOdometer.toLocaleString()} KM` : undefined} />
        <FormTextField
          control={control}
          name="nextServiceKm"
          label="Next Service (KM)"
          type="number"
          helperText={remaining === undefined ? undefined : remaining >= 0 ? `${remaining.toLocaleString()} KM remaining` : `Already ${(-remaining).toLocaleString()} KM past this target`}
        />
        <FullWidth>
          <FormTextField control={control} name="description" label="Description" />
        </FullWidth>
        <FullWidth>
          <FormTextField control={control} name="notes" label="Notes" multiline />
        </FullWidth>
        {selectedVehicle?.status === 'INACTIVE' && (
          <FullWidth>
            <FormCheckbox control={control} name="allowInactive" label="This vehicle is inactive - add the record anyway" />
          </FullWidth>
        )}
      </FormGrid>
    </FormDialog>
  );
}
