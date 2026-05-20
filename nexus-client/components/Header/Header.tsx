'use client';

import { useUserStore } from '@/data/user';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import AdminMiddleware from '../AdminMiddleware';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/dashboard/catalog', label: 'Catálogo' },
  { href: '/dashboard/inventory', label: 'Inventario' },
  { href: '/dashboard/cart', label: 'Carrito' },
  { href: '/dashboard/sales', label: 'Ventas' },
  { href: '/dashboard/purchases', label: 'Compras' },
  { href: '/dashboard/reports', label: 'Reportes' },
  { href: '/dashboard/notifications', label: 'Notificaciones' },
  { href: '/dashboard/refunds', label: 'Devoluciones' },
  { href: '/dashboard/exports', label: 'Exportes' },
];

const linkClass =
  'rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900';

const Header = () => {
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

        <AdminMiddleware>
          <Link
            href="/dashboard/reports?admin=true"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            Admin
          </Link>
        </AdminMiddleware>

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
