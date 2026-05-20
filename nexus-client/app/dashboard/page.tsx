'use client';

import { useUserStore } from '@/data/user';

const Dashboard = () => {
  const user = useUserStore((state) => state.user);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Bienvenido, {user.username}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Usa el menú superior para navegar entre los módulos del sistema.
      </p>
    </div>
  );
};

export default Dashboard;
