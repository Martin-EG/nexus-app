import type { DefaultSession } from 'next-auth';

/**
 * Module augmentation so the Nexus identity returned by the API
 * (`user_id`, `username`, `is_admin`) is typed on the session, the user,
 * and the JWT.
 */
declare module 'next-auth' {
  interface User {
    user_id: number;
    username: string;
    is_admin: boolean;
  }

  interface Session {
    user: {
      user_id: number;
      username: string;
      is_admin: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user_id: number;
    username: string;
    is_admin: boolean;
  }
}
