import { render, screen } from '@testing-library/react';
import { mockFetch } from '@/test-utils';
import Inventario from './page';

describe('Inventory page', () => {
  it('renders inventory rows loaded from the API', async () => {
    mockFetch([
      { id: 1, name: 'Widget', sku: 'S1', warehouse: 'Main', quantity: 5 },
    ]);

    render(<Inventario />);

    expect(
      screen.getByRole('heading', { name: 'Inventario' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Widget')).toBeInTheDocument();
  });

  it('shows an empty state when there is no inventory', async () => {
    mockFetch([]);

    render(<Inventario />);

    expect(
      await screen.findByText('No hay registros para mostrar.'),
    ).toBeInTheDocument();
  });
});
