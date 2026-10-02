import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormDialog } from '../../components/common/FormDialog';
import { FormGrid, FormSelect, FormTextField, FullWidth } from '../../components/common/FormFields';
import { useNotify } from '../../hooks/useNotify';
import { driverService } from '../../services/driverService';
import type { Driver, DriverStatus } from '../../types';
import { applyApiError } from '../../utils/forms';
import { DRIVER_STATUS_OPTIONS, LICENCE_TYPE_OPTIONS } from '../../utils/labels';
import {
  optionalDate,
  optionalNumber,
  optionalText,
  PHONE_REGEX,
  requiredDate,
  requiredText,
  toNumber,
  toText,
} from '../../utils/validation';

export const driverSchema = z.object({
  name: requiredText('Name is required', 100),
  phone: z.string().trim().min(1, 'Phone is required').regex(PHONE_REGEX, 'Enter a valid phone number'),
  address: optionalText(300),
  licenceNumber: requiredText('Licence number is required', 50),
  licenceType: z.string(),
  licenceExpiry: requiredDate('Licence expiry is required'),
  joiningDate: optionalDate,
  salary: optionalNumber('Salary', { min: 0 }),
  status: z.string().min(1),
});

type FormValues = z.infer<typeof driverSchema>;

const EMPTY: FormValues = {
  name: '',
  phone: '',
  address: '',
  licenceNumber: '',
  licenceType: '',
  licenceExpiry: '',
  joiningDate: '',
  salary: '',
  status: 'AVAILABLE',
};

function toFormValues(d: Driver): FormValues {
  return {
    name: d.name,
    phone: d.phone,
    address: d.address ?? '',
    licenceNumber: d.licenceNumber,
    licenceType: d.licenceType ?? '',
    licenceExpiry: d.licenceExpiry,
    joiningDate: d.joiningDate ?? '',
    salary: d.salary?.toString() ?? '',
    status: d.status,
  };
}

interface Props {
  open: boolean;
  driver?: Driver | null;
  onClose: () => void;
  onSaved: () => void;
}

export function DriverFormDialog({ open, driver, onClose, onSaved }: Props) {
  const notify = useNotify();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(driverSchema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) {
      reset(driver ? toFormValues(driver) : EMPTY);
      setFormError(null);
    }
  }, [open, driver, reset]);

  const licenceTypes = useMemo(() => {
    const existing = driver?.licenceType;
    return existing && !LICENCE_TYPE_OPTIONS.some((o) => o.value === existing)
      ? [...LICENCE_TYPE_OPTIONS, { value: existing, label: existing }]
      : LICENCE_TYPE_OPTIONS;
  }, [driver]);

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const body = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: toText(values.address),
      licenceNumber: values.licenceNumber.trim(),
      licenceType: toText(values.licenceType),
      licenceExpiry: values.licenceExpiry,
      joiningDate: toText(values.joiningDate),
      salary: toNumber(values.salary),
      status: values.status as DriverStatus,
    };
    try {
      if (driver) await driverService.update(driver.id, body);
      else await driverService.create(body);
      notify.success(driver ? 'Driver updated' : 'Driver added');
      onSaved();
      onClose();
    } catch (e) {
      applyApiError(e, setError, setFormError, { LICENCE_ALREADY_EXISTS: 'licenceNumber' });
    }
  });

  return (
    <FormDialog
      open={open}
      title={driver ? 'Edit Driver' : 'Add Driver'}
      submitting={isSubmitting}
      error={formError}
      onSubmit={submit}
      onClose={onClose}
    >
      <FormGrid>
        <FormTextField control={control} name="name" label="Name" required />
        <FormTextField control={control} name="phone" label="Phone" type="tel" required />
        <FullWidth>
          <FormTextField control={control} name="address" label="Address" multiline />
        </FullWidth>
        <FormTextField control={control} name="licenceNumber" label="Driving Licence Number" required />
        <FormSelect control={control} name="licenceType" label="Licence Type" options={licenceTypes} allowEmpty emptyLabel="Not specified" />
        <FormTextField control={control} name="licenceExpiry" label="Licence Expiry Date" type="date" required />
        <FormTextField control={control} name="joiningDate" label="Joining Date" type="date" />
        <FormTextField control={control} name="salary" label="Salary (₹)" type="number" />
        <FormSelect control={control} name="status" label="Status" options={DRIVER_STATUS_OPTIONS} />
      </FormGrid>
    </FormDialog>
  );
}
