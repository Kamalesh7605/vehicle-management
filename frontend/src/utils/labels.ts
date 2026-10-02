import type {
  DocumentStatus,
  DocumentType,
  DriverStatus,
  ExpenseCategory,
  FuelType,
  MaintenanceType,
  VehicleStatus,
} from '../types';

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

function options<T extends string>(labels: Record<T, string>): Option<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  DIESEL: 'Diesel',
  PETROL: 'Petrol',
  CNG: 'CNG',
  ELECTRIC: 'Electric',
  HYBRID: 'Hybrid',
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  ACTIVE: 'Active',
  MAINTENANCE: 'In Service',
  INACTIVE: 'Inactive',
};

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  ACTIVE: 'Active',
  AVAILABLE: 'Available',
  INACTIVE: 'Inactive',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  VALID: 'Valid',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
};

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  GENERAL_SERVICE: 'General Service',
  ENGINE_OIL: 'Engine Oil',
  OIL_FILTER: 'Oil Filter',
  AIR_FILTER: 'Air Filter',
  BRAKE: 'Brake',
  CLUTCH: 'Clutch',
  BATTERY: 'Battery',
  TYRE: 'Tyre',
  REPAIR: 'Repair',
  OTHER: 'Other',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FUEL: 'Fuel',
  TOLL: 'Toll',
  PARKING: 'Parking',
  REPAIR: 'Repair',
  MAINTENANCE: 'Maintenance',
  DRIVER_ALLOWANCE: 'Driver Allowance',
  INSURANCE: 'Insurance',
  PERMIT: 'Permit',
  TAX: 'Tax',
  OTHER: 'Other',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  RC: 'RC',
  INSURANCE: 'Insurance',
  FITNESS_CERTIFICATE: 'Fitness Certificate',
  POLLUTION_CERTIFICATE: 'Pollution Certificate',
  PERMIT: 'Permit',
  ROAD_TAX: 'Road Tax',
  DRIVING_LICENCE: 'Driving Licence',
};

export const FUEL_TYPE_OPTIONS = options(FUEL_TYPE_LABELS);
export const VEHICLE_STATUS_OPTIONS = options(VEHICLE_STATUS_LABELS);
export const DRIVER_STATUS_OPTIONS = options(DRIVER_STATUS_LABELS);
export const DOCUMENT_STATUS_OPTIONS = options(DOCUMENT_STATUS_LABELS);
export const MAINTENANCE_TYPE_OPTIONS = options(MAINTENANCE_TYPE_LABELS);
export const EXPENSE_CATEGORY_OPTIONS = options(EXPENSE_CATEGORY_LABELS);
export const DOCUMENT_TYPE_OPTIONS = options(DOCUMENT_TYPE_LABELS);

export const LICENCE_TYPE_OPTIONS: Option[] = ['LMV', 'HMV', 'HGMV', 'HPMV/HTV', 'MCWG'].map((v) => ({
  value: v,
  label: v,
}));
