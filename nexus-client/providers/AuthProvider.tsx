'use client';

import { SessionProvider } from 'next-auth/react';
import { UserStoreSync } from './UserStoreSync';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <UserStoreSync />
      {children}
    </SessionProvider>
  );
}
