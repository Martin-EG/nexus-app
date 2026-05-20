import { render, screen } from '@testing-library/react';
import { mockFetch } from '@/test-utils';
import Catalogo from './page';

describe('Catalog page', () => {
  it('renders products loaded from the API', async () => {
    mockFetch([
      { id: 1, sku: 'SKU-1', name: 'Widget', price: 10, category: 'tools' },
    ]);

    render(<Catalogo />);

    expect(
      screen.getByRole('heading', { name: 'Catálogo' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Widget')).toBeInTheDocument();
  });

  it('shows an empty state when there are no products', async () => {
    mockFetch([]);

    render(<Catalogo />);

    expect(
      await screen.findByText('No hay productos para mostrar.'),
    ).toBeInTheDocument();
  });
});
