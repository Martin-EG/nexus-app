'use client';

import { useUserStore } from '@/data/user';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Login = () => {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setLoading(false);
      setError('Usuario o contraseña inválidos');
      return;
    }

    const session = await getSession();
    setLoading(false);

    if (session?.user) {
      setUser({
        id: String(session.user.user_id),
        db_id: session.user.user_id,
        username: session.user.username,
        is_admin: session.user.is_admin,
      });
    }

    router.push('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Legacy Nexus
        </h2>

        <div className="mb-4">
          <label
            htmlFor="username"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Usuario
          </label>
          <input
            id="username"
            type="text"
            placeholder="usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-black/[.12] bg-white px-3 py-2 text-sm text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-800"
          />
        </div>

        <div className="mb-2">
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-black/[.12] bg-white px-3 py-2 text-sm text-black outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-800"
          />
        </div>

        <button
          onClick={login}
          disabled={loading}
          className="mt-4 w-full rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
