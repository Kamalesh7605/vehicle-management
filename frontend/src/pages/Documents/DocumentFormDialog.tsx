import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Box, Button, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormDialog } from '../../components/common/FormDialog';
import { FormGrid, FormSelect, FormTextField, FullWidth } from '../../components/common/FormFields';
import { useNotify } from '../../hooks/useNotify';
import { getErrorMessage } from '../../services/api';
import { documentService } from '../../services/documentService';
import type { AppDocument, DocumentType } from '../../types';
import { applyApiError } from '../../utils/forms';
import { DOCUMENT_TYPE_OPTIONS, type Option } from '../../utils/labels';
import { optionalDate, optionalText, requiredDate, toText } from '../../utils/validation';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const documentSchema = z
  .object({
    documentType: z.string().min(1, 'Document type is required'),
    ownerId: z.string(),
    documentNumber: optionalText(100),
    issueDate: optionalDate,
    expiryDate: requiredDate('Expiry date is required'),
    notes: optionalText(500),
  })
  .superRefine((values, ctx) => {
    if (!values.ownerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownerId'],
        message: values.documentType === 'DRIVING_LICENCE' ? 'Driver is required' : 'Vehicle is required',
      });
    }
    if (values.issueDate && values.expiryDate && values.issueDate > values.expiryDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['issueDate'], message: 'Issue date must be before expiry' });
    }
  });

type FormValues = z.infer<typeof documentSchema>;

function emptyValues(vehicleId?: number): FormValues {
  return {
    documentType: 'INSURANCE',
    ownerId: vehicleId ? String(vehicleId) : '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    notes: '',
  };
}

function toFormValues(d: AppDocument): FormValues {
  return {
    documentType: d.documentType,
    ownerId: String(d.documentType === 'DRIVING_LICENCE' ? d.driverId : d.vehicleId),
    documentNumber: d.documentNumber ?? '',
    issueDate: d.issueDate ?? '',
    expiryDate: d.expiryDate,
    notes: d.notes ?? '',
  };
}

interface Props {
  open: boolean;
  record?: AppDocument | null;
  /** When set, the dialog is locked to this vehicle and only offers vehicle documents. */
  defaultVehicleId?: number;
  vehicleOptions: Option[];
  driverOptions: Option[];
  onClose: () => void;
  onSaved: () => void;
}

export function DocumentFormDialog({ open, record, defaultVehicleId, vehicleOptions, driverOptions, onClose, onSaved }: Props) {
  const notify = useNotify();
  const [formError, setFormError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(documentSchema), defaultValues: emptyValues(defaultVehicleId) });

  useEffect(() => {
    if (open) {
      reset(record ? toFormValues(record) : emptyValues(defaultVehicleId));
      setFormError(null);
      setFile(null);
      setFileError(null);
    }
  }, [open, record, defaultVehicleId, reset]);

  const type = watch('documentType');
  const isDriverDoc = type === 'DRIVING_LICENCE';
  const typeOptions = useMemo(
    () => (defaultVehicleId ? DOCUMENT_TYPE_OPTIONS.filter((o) => o.value !== 'DRIVING_LICENCE') : DOCUMENT_TYPE_OPTIONS),
    [defaultVehicleId],
  );

  const pickFile = (picked: File | undefined) => {
    setFileError(null);
    if (!picked) return setFile(null);
    if (!ALLOWED_TYPES.includes(picked.type)) {
      setFile(null);
      return setFileError('Only PDF, JPG or PNG files are allowed');
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFile(null);
      return setFileError('File must be 10 MB or smaller');
    }
    setFile(picked);
  };

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const driverDoc = values.documentType === 'DRIVING_LICENCE';
    const body = {
      documentType: values.documentType as DocumentType,
      vehicleId: driverDoc ? undefined : Number(values.ownerId),
      driverId: driverDoc ? Number(values.ownerId) : undefined,
      documentNumber: toText(values.documentNumber),
      issueDate: toText(values.issueDate),
      expiryDate: values.expiryDate,
      notes: toText(values.notes),
    };
    try {
      const saved = record ? await documentService.update(record.id, body) : await documentService.create(body);
      if (file) {
        try {
          await documentService.uploadFile(saved.id, file);
        } catch (uploadError) {
          notify.error(`Document saved, but the file upload failed: ${getErrorMessage(uploadError)}`);
          onSaved();
          onClose();
          return;
        }
      }
      notify.success(record ? 'Document updated' : 'Document added');
      onSaved();
      onClose();
    } catch (e) {
      applyApiError(e, setError, setFormError);
    }
  });

  return (
    <FormDialog
      open={open}
      title={record ? 'Edit Document' : 'Add Document'}
      submitting={isSubmitting}
      error={formError}
      onSubmit={submit}
      onClose={onClose}
    >
      <FormGrid>
        <FormSelect
          control={control}
          name="documentType"
          label="Document Type"
          required
          options={typeOptions}
          onValueChange={(next) => {
            if (!defaultVehicleId && (next === 'DRIVING_LICENCE') !== isDriverDoc) setValue('ownerId', '');
          }}
        />
        <FormSelect
          control={control}
          name="ownerId"
          label={isDriverDoc ? 'Driver' : 'Vehicle'}
          required
          options={isDriverDoc ? driverOptions : vehicleOptions}
          disabled={!!defaultVehicleId}
        />
        <FormTextField control={control} name="documentNumber" label="Document Number" />
        <FormTextField control={control} name="expiryDate" label="Expiry Date" type="date" required />
        <FormTextField control={control} name="issueDate" label="Issue Date" type="date" />
        <Box />
        <FullWidth>
          <FormTextField control={control} name="notes" label="Notes" multiline />
        </FullWidth>
        <FullWidth>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
              {file ? 'Change file' : record?.hasFile ? 'Replace file' : 'Attach file'}
              <input hidden type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(e) => pickFile(e.target.files?.[0])} />
            </Button>
            <Typography variant="body2" color={fileError ? 'error' : 'text.secondary'}>
              {fileError ?? file?.name ?? record?.fileName ?? 'Optional - PDF, JPG or PNG, up to 10 MB'}
            </Typography>
          </Box>
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}
