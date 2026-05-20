import { render } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/data/user';
import { UserStoreSync } from './UserStoreSync';

describe('UserStoreSync', () => {
  afterEach(() => {
    useUserStore.setState({
      user: { id: '', db_id: 0, username: '', is_admin: false },
    });
    jest.clearAllMocks();
  });

  it('hydrates the store from an authenticated session', () => {
    (useSession as jest.Mock).mockReturnValue({
      status: 'authenticated',
      data: { user: { user_id: 7, username: 'alice', is_admin: true } },
    });

    render(<UserStoreSync />);

    expect(useUserStore.getState().user).toEqual({
      id: '7',
      db_id: 7,
      username: 'alice',
      is_admin: true,
    });
  });

  it('clears the store when the session is unauthenticated', () => {
    useUserStore.setState({
      user: { id: '7', db_id: 7, username: 'alice', is_admin: true },
    });
    (useSession as jest.Mock).mockReturnValue({
      status: 'unauthenticated',
      data: null,
    });

    render(<UserStoreSync />);

    expect(useUserStore.getState().user.db_id).toBe(0);
    expect(useUserStore.getState().user.username).toBe('');
  });
});
