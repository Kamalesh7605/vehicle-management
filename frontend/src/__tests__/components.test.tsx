import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';

interface Row {
  id: number;
  name: string;
}

const columns: Column<Row>[] = [{ key: 'name', header: 'Name', render: (r) => r.name }];

describe('StatusChip', () => {
  it('shows friendly labels', () => {
    render(
      <>
        <StatusChip status="MAINTENANCE" />
        <StatusChip status="EXPIRING_SOON" />
        <StatusChip status="ACTIVE" />
      </>,
    );
    expect(screen.getByText('In Service')).toBeInTheDocument();
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});

describe('DataTable', () => {
  it('shows a loading state, then rows', () => {
    const { rerender } = render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<DataTable columns={columns} rows={[{ id: 1, name: 'TN 50 AB 1234' }]} rowKey={(r) => r.id} />);
    expect(screen.getByText('TN 50 AB 1234')).toBeInTheDocument();
  });

  it('shows an empty state with an action', async () => {
    const onAction = vi.fn();
    render(
      <DataTable columns={columns} rows={[]} rowKey={(r) => r.id} emptyTitle="No vehicles yet" emptyActionLabel="Add Vehicle" onEmptyAction={onAction} />,
    );
    expect(screen.getByText('No vehicles yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add Vehicle' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('shows an error state with retry instead of a blank screen', async () => {
    const onRetry = vi.fn();
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} error="Cannot reach the server" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot reach the server');
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('paginates rows in the browser', async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `Vehicle ${i + 1}` }));
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText('Vehicle 10')).toBeInTheDocument();
    expect(screen.queryByText('Vehicle 11')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByText('Vehicle 11')).toBeInTheDocument();
  });
});
