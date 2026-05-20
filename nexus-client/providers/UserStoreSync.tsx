'use client';

import { useUserStore } from '@/data/user';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Keeps the zustand user store in sync with the NextAuth session.
 *
 * The store is in-memory and resets on a full page reload; this hydrates it
 * from the session cookie (which survives reloads) and clears it on sign-out.
 * Renders nothing.
 */
export function UserStoreSync() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: String(session.user.user_id),
        db_id: session.user.user_id,
        username: session.user.username,
        is_admin: session.user.is_admin,
      });
    } else if (status === 'unauthenticated') {
      setUser({ id: '', db_id: 0, username: '', is_admin: false });
    }
  }, [status, session, setUser]);

  return null;
}
