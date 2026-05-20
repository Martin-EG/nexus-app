import { render, screen } from '@testing-library/react';
import { mockFetch } from '@/test-utils';
import Reportes from './page';

describe('Reports page', () => {
  it('renders the reports heading', () => {
    mockFetch([]);

    render(<Reportes />);

    expect(
      screen.getByRole('heading', { name: 'Reportes' }),
    ).toBeInTheDocument();
  });

  it('shows an empty state for a month with no records', async () => {
    mockFetch([]);

    render(<Reportes />);

    expect(
      await screen.findByText('No hay registros para el mes.'),
    ).toBeInTheDocument();
  });
});
