import { render, screen } from '@testing-library/react';
import Exportes from './page';

describe('Exports page', () => {
  it('renders the exports controls', () => {
    render(<Exportes />);

    expect(
      screen.getByRole('heading', { name: /Exportes/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Dimensión A')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Generar pivot' }),
    ).toBeInTheDocument();
  });
});
