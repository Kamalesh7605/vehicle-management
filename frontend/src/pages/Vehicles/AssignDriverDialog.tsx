import { Alert, Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { FormDialog } from '../../components/common/FormDialog';
import { useApi } from '../../hooks/useApi';
import { useNotify } from '../../hooks/useNotify';
import { getErrorMessage } from '../../services/api';
import { driverService } from '../../services/driverService';
import { vehicleService } from '../../services/vehicleService';
import type { Driver, Vehicle } from '../../types';
import { todayIso } from '../../utils/dates';

interface Props {
  open: boolean;
  /** Provide one of vehicle / driver; the other is chosen in the dialog. */
  vehicle?: Vehicle | null;
  driver?: Driver | null;
  onClose: () => void;
  onDone: () => void;
}

/** Assigns a driver to a vehicle (closing the previous assignment) or unassigns the current driver. */
export function AssignDriverDialog({ open, vehicle, driver, onClose, onDone }: Props) {
  const notify = useNotify();
  const vehicleMode = !!vehicle;
  const drivers = useApi(() => (open && vehicleMode ? driverService.list() : Promise.resolve([] as Driver[])), [open, vehicleMode]);
  const vehicles = useApi(() => (open && !vehicleMode ? vehicleService.list() : Promise.resolve([] as Vehicle[])), [open, vehicleMode]);

  const [selectedId, setSelectedId] = useState('');
  const [startDate, setStartDate] = useState(todayIso());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedId('');
      setStartDate(todayIso());
      setError(null);
    }
  }, [open, vehicle, driver]);

  const run = async (body: { vehicleId: number; driverId: number | null }, success: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await vehicleService.assignDriver({ ...body, startDate: startDate || undefined });
      notify.success(success);
      onDone();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vehicle) {
      const driverId = selectedId ? Number(selectedId) : null;
      if (driverId === null && !vehicle.assignedDriverId) {
        setError('Select a driver to assign.');
        return;
      }
      void run({ vehicleId: vehicle.id, driverId }, driverId === null ? 'Driver unassigned' : 'Driver assigned');
    } else if (driver) {
      if (!selectedId) {
        setError('Select a vehicle.');
        return;
      }
      void run({ vehicleId: Number(selectedId), driverId: driver.id }, 'Vehicle assigned');
    }
  };

  const title = vehicle ? `Assign driver to ${vehicle.vehicleNumber}` : `Assign vehicle to ${driver?.name ?? ''}`;

  return (
    <FormDialog
      open={open}
      title={title}
      submitLabel={vehicle && !selectedId && vehicle.assignedDriverId ? 'Unassign' : 'Assign'}
      submitting={submitting}
      error={error}
      maxWidth="xs"
      onSubmit={submit}
      onClose={onClose}
    >
      <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
        {vehicle?.assignedDriverName && (
          <Alert severity="info">
            Current driver: <strong>{vehicle.assignedDriverName}</strong>. Assigning a new driver closes this
            assignment and keeps it in the history.
          </Alert>
        )}
        {driver?.assignedVehicleNumber && (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                disabled={submitting}
                onClick={() => void run({ vehicleId: driver.assignedVehicleId!, driverId: null }, 'Driver unassigned')}
              >
                Unassign
              </Button>
            }
          >
            Currently driving {driver.assignedVehicleNumber}. Unassign first to move to another vehicle.
          </Alert>
        )}

        {vehicle ? (
          <TextField select label="Driver" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            helperText={drivers.error ?? undefined} error={!!drivers.error}>
            <MenuItem value="">
              <em>{vehicle.assignedDriverId ? 'No driver (unassign)' : 'Select a driver'}</em>
            </MenuItem>
            {(drivers.data ?? [])
              .filter((d) => d.status !== 'INACTIVE' && d.id !== vehicle.assignedDriverId)
              .map((d) => (
                <MenuItem key={d.id} value={String(d.id)} disabled={!!d.assignedVehicleId}>
                  {d.name}
                  {d.assignedVehicleNumber && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      on {d.assignedVehicleNumber}
                    </Typography>
                  )}
                </MenuItem>
              ))}
          </TextField>
        ) : (
          <TextField select label="Vehicle" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
            helperText={vehicles.error ?? undefined} error={!!vehicles.error}
            disabled={!!driver?.assignedVehicleNumber}>
            {(vehicles.data ?? []).map((v) => (
              <MenuItem key={v.id} value={String(v.id)}>
                {v.vehicleNumber}
                {v.assignedDriverName && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    driver: {v.assignedDriverName} (will be replaced)
                  </Typography>
                )}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          type="date"
          label="Start date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </FormDialog>
  );
}
