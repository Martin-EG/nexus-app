import { render, screen } from '@testing-library/react';
import { mockFetch } from '@/test-utils';
import Compras from './page';

describe('Purchases page', () => {
  it('renders the purchases heading and form', () => {
    mockFetch([]);

    render(<Compras />);

    expect(screen.getByRole('heading', { name: 'Compras' })).toBeInTheDocument();
    expect(screen.getByLabelText('Proveedor')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Registrar' }),
    ).toBeInTheDocument();
  });

  it('shows an empty state when there are no purchases', async () => {
    mockFetch([]);

    render(<Compras />);

    expect(
      await screen.findByText('No hay compras para mostrar.'),
    ).toBeInTheDocument();
  });
});
