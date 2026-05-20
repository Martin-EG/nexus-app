import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

/**
 * NextAuth configuration.
 *
 * Authentication is delegated to the Nexus API: the credentials provider
 * posts the username/password to `POST /api/auth/login` and, on success,
 * stores the returned identity in a JWT session.
 *
 * Exported separately from the route handler so it can be reused with
 * `getServerSession(authOptions)` in server components and route handlers.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        });

        if (!res.ok) {
          return null;
        }

        const data = (await res.json()) as {
          user_id: number;
          username: string;
          is_admin: boolean;
        };

        return {
          id: String(data.user_id),
          user_id: data.user_id,
          username: data.username,
          is_admin: data.is_admin,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.user_id = user.user_id;
        token.username = user.username;
        token.is_admin = user.is_admin;
      }
      return token;
    },
    session({ session, token }) {
      session.user = {
        ...session.user,
        user_id: token.user_id,
        username: token.username,
        is_admin: token.is_admin,
      };
      return session;
    },
  },
};
