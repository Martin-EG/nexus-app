'use client';

import { useUserStore } from '@/data/user';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

const Header = () => {
  const { is_admin } = useUserStore((state) => state.user);

  const logout = () => {
    // Clears the NextAuth session, then redirects to the login page.
    signOut({ callbackUrl: '/login' });
  };

  const adminReportsPage = is_admin ? (
    <Link href="/reports?admin=true">
      Admin
    </Link>
  ) : null;
  
  return (
    <header>
        <Link href="/">Inicio</Link>
        <Link href="/catalogo">Catálogo</Link>
        <Link href="/inventario">Inventario</Link>
        <Link href="/carrito">Carrito</Link>
      <Link href="/ventas">Ventas</Link>
      <Link href="/compras">Compras</Link>
      <Link href="/reportes">Reportes</Link>
      <Link href="/notificaciones">Notificaciones</Link>
      <Link href="/devoluciones">Devoluciones</Link>
      <Link href="/exportes">Exportes</Link>
      {adminReportsPage}
      <Link href="#" onClick={logout} style={{ float: 'right' }}>
        Salir
      </Link>
    </header>
  )
};

export default Header;