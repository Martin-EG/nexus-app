import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Home from './page';

// `app/page.tsx` is an async Server Component, so it is exercised by calling
// the function directly rather than rendering it (Jest cannot render async
// Server Components).
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));

describe('Home page', () => {
  afterEach(() => jest.clearAllMocks());

  it('redirects to /login when there is no session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    await expect(Home()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('redirects to /dashboard when a session exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 1 } });

    await expect(Home()).rejects.toThrow('NEXT_REDIRECT:/dashboard');
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
});
