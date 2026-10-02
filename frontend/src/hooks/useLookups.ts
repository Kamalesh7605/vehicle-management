import { useMemo } from 'react';
import { driverService } from '../services/driverService';
import { vehicleService } from '../services/vehicleService';
import type { Driver, Vehicle } from '../types';
import type { Option } from '../utils/labels';
import { useApi } from './useApi';

/** All vehicles, plus ready-made <select> options. */
export function useVehicleLookup(enabled = true) {
  const state = useApi(() => (enabled ? vehicleService.list() : Promise.resolve([] as Vehicle[])), [enabled]);
  const options = useMemo<Option[]>(
    () =>
      (state.data ?? []).map((v) => ({
        value: String(v.id),
        label: v.status === 'INACTIVE' ? `${v.vehicleNumber} (Inactive)` : v.vehicleNumber,
      })),
    [state.data],
  );
  return { ...state, vehicles: state.data ?? [], options };
}

export function useDriverLookup(enabled = true) {
  const state = useApi(() => (enabled ? driverService.list() : Promise.resolve([] as Driver[])), [enabled]);
  const options = useMemo<Option[]>(
    () => (state.data ?? []).map((d) => ({ value: String(d.id), label: d.name })),
    [state.data],
  );
  return { ...state, drivers: state.data ?? [], options };
}
