import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotifyProvider } from '../hooks/useNotify';
import { FuelFormDialog, calculateFuelTotal } from '../pages/Fuel/FuelFormDialog';
import { VehicleFormDialog } from '../pages/Vehicles/VehicleFormDialog';
import { ApiError } from '../services/api';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle } from '../types';

vi.mock('../services/vehicleService', () => ({
  vehicleService: { create: vi.fn(), update: vi.fn() },
}));

const vehicle: Vehicle = {
  id: 1,
  vehicleNumber: 'TN 50 AB 1234',
  vehicleType: 'Truck',
  manufacturer: 'Ashok Leyland',
  model: 'Boss',
  manufacturingYear: 2019,
  fuelType: 'DIESEL',
  registrationDate: null,
  currentOdometer: 245320,
  status: 'ACTIVE',
  assignedDriverId: null,
  assignedDriverName: null,
};

const wrap = (ui: React.ReactElement) => render(<NotifyProvider>{ui}</NotifyProvider>);

describe('calculateFuelTotal', () => {
  it('multiplies litres by price and rounds to 2 decimals', () => {
    expect(calculateFuelTotal('50', '90')).toBe('4500.00');
    expect(calculateFuelTotal('33.3', '91.45')).toBe('3045.29');
  });

  it('returns empty when an input is missing or invalid', () => {
    expect(calculateFuelTotal('', '90')).toBe('');
    expect(calculateFuelTotal('abc', '90')).toBe('');
  });
});

describe('VehicleFormDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires a vehicle number and does not call the API', async () => {
    wrap(<VehicleFormDialog open onClose={vi.fn()} onSaved={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Vehicle number is required')).toBeInTheDocument();
    expect(vehicleService.create).not.toHaveBeenCalled();
  });

  it('shows the duplicate-number error from the API on the field', async () => {
    vi.mocked(vehicleService.create).mockRejectedValue(
      new ApiError('Vehicle number already exists', 409, 'VEHICLE_ALREADY_EXISTS'),
    );
    wrap(<VehicleFormDialog open onClose={vi.fn()} onSaved={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/vehicle number/i), 'TN 50 AB 1234');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Vehicle number already exists')).toBeInTheDocument();
  });

  it('submits trimmed values, closes and refreshes on success', async () => {
    vi.mocked(vehicleService.create).mockResolvedValue(vehicle);
    const onClose = vi.fn();
    const onSaved = vi.fn();
    wrap(<VehicleFormDialog open onClose={onClose} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText(/vehicle number/i), '  TN 50 AB 1234 ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(vehicleService.create).toHaveBeenCalled());
    expect(vi.mocked(vehicleService.create).mock.calls[0][0]).toMatchObject({
      vehicleNumber: 'TN 50 AB 1234',
      fuelType: 'DIESEL',
      status: 'ACTIVE',
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalled();
  });
});

describe('FuelFormDialog', () => {
  const options = [{ value: '1', label: 'TN 50 AB 1234' }];

  it('auto-calculates the total from quantity and price, and lets the user override it', async () => {
    wrap(<FuelFormDialog open vehicles={[vehicle]} vehicleOptions={options} onClose={vi.fn()} onSaved={vi.fn()} />);
    const total = screen.getByLabelText(/total amount/i) as HTMLInputElement;

    await userEvent.type(screen.getByLabelText(/quantity/i), '50');
    await userEvent.type(screen.getByLabelText(/price per litre/i), '90');
    await waitFor(() => expect(total.value).toBe('4500.00'));

    await userEvent.clear(total);
    await userEvent.type(total, '4400');
    await userEvent.type(screen.getByLabelText(/quantity/i), '0'); // 500 L x 90 would be 45000
    expect(total.value).toBe('4400');
  });

  it('validates required fields', async () => {
    wrap(<FuelFormDialog open vehicles={[vehicle]} vehicleOptions={options} onClose={vi.fn()} onSaved={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Vehicle is required')).toBeInTheDocument();
    expect(screen.getByText('Quantity is required')).toBeInTheDocument();
    expect(screen.getByText('Price per litre is required')).toBeInTheDocument();
  });
});
