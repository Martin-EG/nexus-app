import { render, screen } from '@testing-library/react';
import { useUserStore } from '@/data/user';
import { mockFetch, TEST_USER } from '@/test-utils';
import Refunds from './page';

describe('Refunds page', () => {
  afterEach(() => {
    useUserStore.setState({
      user: { id: '', db_id: 0, username: '', is_admin: false },
    });
  });

  it('renders refunds loaded for the signed-in user', async () => {
    useUserStore.setState({ user: TEST_USER });
    mockFetch([
      {
        id: 1,
        saleId: 9,
        reason: 'Producto dañado',
        amount: 50,
        status: 'pending',
        createdAt: '02/02/2025',
      },
    ]);

    render(<Refunds />);

    expect(
      screen.getByRole('heading', { name: 'Devoluciones' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Producto dañado')).toBeInTheDocument();
  });

  it('shows an empty state when there are no refunds', async () => {
    useUserStore.setState({ user: TEST_USER });
    mockFetch([]);

    render(<Refunds />);

    expect(await screen.findByText('No hay devoluciones.')).toBeInTheDocument();
  });
});
