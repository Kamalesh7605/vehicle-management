export type FuelType = 'DIESEL' | 'PETROL' | 'CNG' | 'ELECTRIC' | 'HYBRID';
export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
export type DriverStatus = 'ACTIVE' | 'INACTIVE' | 'AVAILABLE';
export type DocumentStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
export type MaintenanceType =
  | 'GENERAL_SERVICE'
  | 'ENGINE_OIL'
  | 'OIL_FILTER'
  | 'AIR_FILTER'
  | 'BRAKE'
  | 'CLUTCH'
  | 'BATTERY'
  | 'TYRE'
  | 'REPAIR'
  | 'OTHER';
export type ExpenseCategory =
  | 'FUEL'
  | 'TOLL'
  | 'PARKING'
  | 'REPAIR'
  | 'MAINTENANCE'
  | 'DRIVER_ALLOWANCE'
  | 'INSURANCE'
  | 'PERMIT'
  | 'TAX'
  | 'OTHER';
export type DocumentType =
  | 'RC'
  | 'INSURANCE'
  | 'FITNESS_CERTIFICATE'
  | 'POLLUTION_CERTIFICATE'
  | 'PERMIT'
  | 'ROAD_TAX'
  | 'DRIVING_LICENCE';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleType: string | null;
  manufacturer: string | null;
  model: string | null;
  manufacturingYear: number | null;
  fuelType: FuelType;
  registrationDate: string | null;
  currentOdometer: number;
  status: VehicleStatus;
  assignedDriverId: number | null;
  assignedDriverName: string | null;
}

export interface VehicleRequest {
  vehicleNumber: string;
  vehicleType?: string;
  manufacturer?: string;
  model?: string;
  manufacturingYear?: number;
  fuelType: FuelType;
  registrationDate?: string;
  currentOdometer?: number;
  status?: VehicleStatus;
}

export interface MileageInfo {
  mileage: number | null;
  distanceKm: number | null;
  fuelUsedLitres: number | null;
  message: string | null;
}

export interface ServiceInfo {
  nextServiceKm: number | null;
  remainingKm: number | null;
  lastServiceDate: string | null;
  due: boolean;
}

export interface VehicleSummary {
  vehicle: Vehicle;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalOtherExpenses: number;
  totalExpenses: number;
  mileage: MileageInfo;
  service: ServiceInfo;
  driverSince: string | null;
  lastFuelDate: string | null;
  expiredDocuments: number;
  expiringDocuments: number;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  licenceNumber: string;
  licenceType: string | null;
  licenceExpiry: string;
  licenceStatus: DocumentStatus;
  joiningDate: string | null;
  salary: number | null;
  status: DriverStatus;
  assignedVehicleId: number | null;
  assignedVehicleNumber: string | null;
}

export interface DriverRequest {
  name: string;
  phone: string;
  address?: string;
  licenceNumber: string;
  licenceType?: string;
  licenceExpiry: string;
  joiningDate?: string;
  salary?: number;
  status?: DriverStatus;
}

export interface Assignment {
  id: number;
  vehicleId: number;
  vehicleNumber: string;
  driverId: number;
  driverName: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
}

export interface AssignmentRequest {
  vehicleId: number;
  driverId: number | null;
  startDate?: string;
}

export interface FuelRecord {
  id: number;
  vehicleId: number;
  vehicleNumber: string;
  date: string;
  fuelType: FuelType | null;
  quantity: number;
  pricePerLitre: number;
  totalAmount: number;
  odometer: number | null;
  fuelStation: string | null;
  notes: string | null;
}

export interface FuelRequest {
  vehicleId: number;
  date: string;
  fuelType?: FuelType;
  quantity: number;
  pricePerLitre: number;
  totalAmount?: number;
  odometer?: number;
  fuelStation?: string;
  notes?: string;
  allowInactive?: boolean;
}

export interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  vehicleNumber: string;
  date: string;
  maintenanceType: MaintenanceType;
  description: string | null;
  odometer: number | null;
  cost: number;
  nextServiceKm: number | null;
  currentKm: number | null;
  remainingKm: number | null;
  notes: string | null;
}

export interface MaintenanceRequest {
  vehicleId: number;
  date: string;
  maintenanceType: MaintenanceType;
  description?: string;
  odometer?: number;
  cost: number;
  nextServiceKm?: number;
  notes?: string;
  allowInactive?: boolean;
}

export interface Expense {
  id: number;
  vehicleId: number;
  vehicleNumber: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  notes: string | null;
}

export interface ExpenseRequest {
  vehicleId: number;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  notes?: string;
}

export interface AppDocument {
  id: number;
  documentType: DocumentType;
  vehicleId: number | null;
  vehicleNumber: string | null;
  driverId: number | null;
  driverName: string | null;
  documentNumber: string | null;
  issueDate: string | null;
  expiryDate: string;
  status: DocumentStatus;
  daysRemaining: number;
  notes: string | null;
  fileName: string | null;
  hasFile: boolean;
}

export interface DocumentRequest {
  documentType: DocumentType;
  vehicleId?: number;
  driverId?: number;
  documentNumber?: string;
  issueDate?: string;
  expiryDate: string;
  notes?: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'WARNING' | 'DANGER';
  title: string;
  subject: string;
  link: string;
  /** id + type; changes when an alert escalates, which makes it unread again. */
  key: string;
  /** true once the signed-in user has opened the notifications (stored on the server). */
  read: boolean;
}

export interface DashboardSummary {
  totalVehicles: number;
  activeVehicles: number;
  inServiceVehicles: number;
  inactiveVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  inactiveDrivers: number;
  fuelExpense: number;
  maintenanceExpense: number;
  otherExpense: number;
  totalExpense: number;
  from: string;
  to: string;
}

export interface MonthlyExpense {
  month: string;
  label: string;
  fuel: number;
  maintenance: number;
  other: number;
  total: number;
}

export interface ExpenseBreakdown {
  total: number;
  items: { key: string; name: string; amount: number; percentage: number }[];
}

export interface VehicleExpenseRow {
  vehicleId: number;
  vehicleNumber: string;
  fuel: number;
  maintenance: number;
  toll: number;
  other: number;
  total: number;
}

export interface DriverReportRow {
  driverId: number;
  driverName: string;
  phone: string;
  vehicleNumber: string | null;
  status: DriverStatus;
  licenceNumber: string;
  licenceExpiry: string;
  licenceStatus: DocumentStatus;
}

export interface VehicleSummaryRow {
  vehicleId: number;
  vehicleNumber: string;
  currentOdometer: number;
  totalFuel: number;
  totalMaintenance: number;
  totalExpenses: number;
  mileage: number | null;
  mileageNote: string | null;
}

export interface ReportFilters {
  from?: string;
  to?: string;
  vehicleId?: number;
  driverId?: number;
  category?: ExpenseCategory;
}
