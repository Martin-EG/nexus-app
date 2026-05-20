import { render, screen } from '@testing-library/react';
import { useUserStore } from '@/data/user';
import { mockFetch, TEST_USER } from '@/test-utils';
import Notifications from './page';

describe('Notifications page', () => {
  afterEach(() => {
    useUserStore.setState({
      user: { id: '', db_id: 0, username: '', is_admin: false },
    });
  });

  it('renders notifications loaded for the signed-in user', async () => {
    useUserStore.setState({ user: TEST_USER });
    mockFetch([
      {
        id: 1,
        message: 'Bienvenido',
        kind: 'info',
        status: 'unread',
        createdAt: '02/02/2025',
      },
    ]);

    render(<Notifications />);

    expect(
      screen.getByRole('heading', { name: 'Notificaciones' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Bienvenido')).toBeInTheDocument();
  });

  it('shows an empty state when there are no notifications', async () => {
    useUserStore.setState({ user: TEST_USER });
    mockFetch([]);

    render(<Notifications />);

    expect(
      await screen.findByText('No hay notificaciones.'),
    ).toBeInTheDocument();
  });
});
