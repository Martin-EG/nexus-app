import { render, screen } from '@testing-library/react';
import AuthProvider from './AuthProvider';

describe('AuthProvider', () => {
  it('renders its children', () => {
    render(
      <AuthProvider>
        <p>contenido protegido</p>
      </AuthProvider>,
    );

    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
  });
});
