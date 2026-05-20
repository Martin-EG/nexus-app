import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getSession, signIn } from 'next-auth/react';
import Login from './page';

describe('Login page', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the login form', () => {
    render(<Login />);

    expect(screen.getByRole('heading', { name: 'Nexus' })).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('submits the typed credentials through signIn', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true, error: null });
    (getSession as jest.Mock).mockResolvedValue({
      user: { user_id: 1, username: 'alice', is_admin: false },
    });

    render(<Login />);
    fireEvent.change(screen.getByLabelText('Usuario'), {
      target: { value: 'alice' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith('credentials', {
        username: 'alice',
        password: 'secret',
        redirect: false,
      }),
    );
  });

  it('shows an error alert when credentials are invalid', async () => {
    (signIn as jest.Mock).mockResolvedValue({ error: 'CredentialsSignin' });

    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Usuario o contraseña inválidos',
    );
  });
});
