import { render, screen } from '@testing-library/react';
import { useUserStore } from '@/data/user';
import AdminMiddleware from './AdminMiddleware';

const resetStore = () =>
  useUserStore.setState({
    user: { id: '', db_id: 0, username: '', is_admin: false },
  });

describe('AdminMiddleware', () => {
  afterEach(resetStore);

  it('hides its children from non-admin users', () => {
    useUserStore.setState({
      user: { id: '1', db_id: 1, username: 'user', is_admin: false },
    });

    render(
      <AdminMiddleware>
        <p>contenido admin</p>
      </AdminMiddleware>,
    );

    expect(screen.queryByText('contenido admin')).not.toBeInTheDocument();
  });

  it('renders its children for admin users', () => {
    useUserStore.setState({
      user: { id: '1', db_id: 1, username: 'admin', is_admin: true },
    });

    render(
      <AdminMiddleware>
        <p>contenido admin</p>
      </AdminMiddleware>,
    );

    expect(screen.getByText('contenido admin')).toBeInTheDocument();
  });
});
