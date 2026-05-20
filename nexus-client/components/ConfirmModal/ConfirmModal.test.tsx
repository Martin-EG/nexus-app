import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmModal from './ConfirmModal';

const baseProps = {
  title: 'Eliminar producto',
  message: '¿Seguro que deseas continuar?',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

describe('ConfirmModal', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<ConfirmModal open={false} {...baseProps} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the title and message when open', () => {
    render(<ConfirmModal open {...baseProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Eliminar producto')).toBeInTheDocument();
    expect(
      screen.getByText('¿Seguro que deseas continuar?'),
    ).toBeInTheDocument();
  });

  it('invokes the confirm and cancel callbacks', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmModal
        open
        {...baseProps}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('closes on the Escape key', () => {
    const onCancel = jest.fn();
    render(<ConfirmModal open {...baseProps} onCancel={onCancel} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
