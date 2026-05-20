'use client';

import { useUserStore } from '@/data/user';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/dashboard/catalogo', label: 'Catálogo' },
  { href: '/dashboard/inventario', label: 'Inventario' },
  { href: '/dashboard/carrito', label: 'Carrito' },
  { href: '/dashboard/ventas', label: 'Ventas' },
  { href: '/dashboard/compras', label: 'Compras' },
  { href: '/dashboard/reportes', label: 'Reportes' },
  { href: '/dashboard/notificaciones', label: 'Notificaciones' },
  { href: '/dashboard/devoluciones', label: 'Devoluciones' },
  { href: '/dashboard/exportes', label: 'Exportes' },
];

const linkClass =
  'rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900';

const Header = () => {
  const { is_admin } = useUserStore((state) => state.user);

  const logout = () => {
    // Clears the NextAuth session, then redirects to the login page.
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-6 py-3">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass}>
            {link.label}
          </Link>
        ))}

        {is_admin && (
          <Link
            href="/reports?admin=true"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Admin
          </Link>
        )}

        <button
          onClick={logout}
          className="ml-auto rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Salir
        </button>
      </nav>
    </header>
  );
};

export default Header;
