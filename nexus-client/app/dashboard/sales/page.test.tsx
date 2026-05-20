import { render, screen } from '@testing-library/react';
import { useUserStore } from '@/data/user';
import { mockFetch, TEST_USER } from '@/test-utils';
import Ventas from './page';

describe('Sales page', () => {
  afterEach(() => {
    useUserStore.setState({
      user: { id: '', db_id: 0, username: '', is_admin: false },
    });
  });

  it('renders sales loaded for the signed-in user', async () => {
    useUserStore.setState({ user: TEST_USER });
    mockFetch([
      {
        id: 1,
        customerType: 'NORMAL',
        subtotal: 100,
        total: 116,
        status: 'completed',
        createdAt: '02/02/2025',
      },
    ]);

    render(<Ventas />);

    expect(screen.getByRole('heading', { name: 'Ventas' })).toBeInTheDocument();
    expect(await screen.findByText('NORMAL')).toBeInTheDocument();
  });

  it('shows an empty state when the user has no sales', async () => {
    useUserStore.setState({ user: TEST_USER });
    mockFetch([]);

    render(<Ventas />);

    expect(
      await screen.findByText('No hay ventas para mostrar.'),
    ).toBeInTheDocument();
  });
});
