import { render, screen } from '@testing-library/react';
import { useUserStore } from '@/data/user';
import { TEST_USER } from '@/test-utils';
import Dashboard from './page';

describe('Dashboard page', () => {
  afterEach(() => {
    useUserStore.setState({
      user: { id: '', db_id: 0, username: '', is_admin: false },
    });
  });

  it('greets the signed-in user', () => {
    useUserStore.setState({ user: TEST_USER });

    render(<Dashboard />);

    expect(
      screen.getByRole('heading', { name: /Bienvenido/ }),
    ).toHaveTextContent('tester');
  });
});
