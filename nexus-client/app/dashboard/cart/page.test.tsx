import { fireEvent, render, screen } from '@testing-library/react';
import Cart from './page';

describe('Cart page', () => {
  it('renders an empty cart', () => {
    render(<Cart />);

    expect(screen.getByRole('heading', { name: 'Carrito' })).toBeInTheDocument();
    expect(screen.getByText('El carrito está vacío.')).toBeInTheDocument();
  });

  it('validates the add-item form', () => {
    render(<Cart />);

    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ingresa un ID de producto',
    );
  });
});
