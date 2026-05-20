import '@testing-library/jest-dom';
import type { ReactNode } from 'react';

// next/navigation needs an App Router context that doesn't exist in unit
// tests — a single stable router object is exposed so tests can assert on it.
jest.mock('next/navigation', () => {
  const router = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  };
  return {
    useRouter: () => router,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    // Real redirect() throws to halt rendering — mirror that so callers stop.
    redirect: jest.fn((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    }),
  };
});

// next-auth/react — auth is stubbed; individual tests configure these mocks.
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));
