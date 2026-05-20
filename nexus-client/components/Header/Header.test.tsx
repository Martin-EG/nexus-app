import { fireEvent, render, screen } from '@testing-library/react';
import { signOut } from 'next-auth/react';
import { useUserStore } from '@/data/user';
import Header from './Header';

describe('Header', () => {
  afterEach(() => {
    useUserStore.setState({
      user: { id: '', db_id: 0, username: '', is_admin: false },
    });
    jest.clearAllMocks();
  });

  it('renders the navigation links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Catálogo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ventas' })).toBeInTheDocument();
  });

  it('hides the Admin link from non-admin users', () => {
    render(<Header />);

    expect(
      screen.queryByRole('link', { name: 'Admin' }),
    ).not.toBeInTheDocument();
  });

  it('shows the Admin link for admin users', () => {
    useUserStore.setState({
      user: { id: '1', db_id: 1, username: 'admin', is_admin: true },
    });

    render(<Header />);

    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });

  it('signs out when "Salir" is clicked', () => {
    render(<Header />);

    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });
});
