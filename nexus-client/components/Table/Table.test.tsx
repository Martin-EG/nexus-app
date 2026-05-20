import { render, screen } from '@testing-library/react';
import Table from './Table';

describe('Table', () => {
  it('renders a header for each column', () => {
    render(<Table columns={['Nombre', 'Precio']} data={[]} />);

    expect(
      screen.getByRole('columnheader', { name: 'Nombre' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Precio' }),
    ).toBeInTheDocument();
  });

  it('renders a row for each data item', () => {
    render(
      <Table
        columns={['Nombre', 'Precio']}
        data={[
          { Nombre: 'Widget', Precio: '$10' },
          { Nombre: 'Gadget', Precio: '$20' },
        ]}
      />,
    );

    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('Gadget')).toBeInTheDocument();
    expect(screen.getByText('$20')).toBeInTheDocument();
  });

  it('shows a dash when a cell value is missing', () => {
    render(<Table columns={['Nombre']} data={[{}]} />);

    expect(screen.getByRole('cell')).toHaveTextContent('-');
  });
});
