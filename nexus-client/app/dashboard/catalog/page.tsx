'use client';

import ConfirmModal from '@/components/ConfirmModal';
import Table from '@/components/Table';
import { useUserStore } from '@/data/user';
import { useEffect, useState, type ReactNode } from 'react';

type Product = {
  id: number;
  sku: string;
  name: string;
  price: number;
  category: string;
};

const Catalogo = () => {
  const { is_admin } = useUserStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const loadAll = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  const search = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        `/api/products/search?q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch {
      setError('La búsqueda falló.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const { id } = productToDelete;
    setProductToDelete(null);
    setError('');
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch {
      setError('No se pudo eliminar el producto.');
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = ['SKU', 'Nombre', 'Precio', 'Categoría'];
  if (is_admin) columns.push('Acciones');

  const rows = products.map((product) => {
    const row: Record<string, ReactNode> = {
      SKU: product.sku,
      Nombre: product.name,
      Precio: `$${product.price}`,
      Categoría: product.category,
    };
    if (is_admin) {
      row.Acciones = (
        <button
          onClick={() => setProductToDelete(product)}
          className="rounded-md px-2 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Eliminar
        </button>
      );
    }
    return row;
  });

  const buttonClass = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors';

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Catálogo
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void search();
          }}
          placeholder="Buscar por nombre"
          aria-label="Buscar productos por nombre"
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
        />
        <button
          onClick={() => void search()}
          className={`${buttonClass} bg-zinc-900 text-white hover:bg-zinc-700`}
        >
          Buscar
        </button>
        <button
          onClick={() => void loadAll()}
          className={`${buttonClass} border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50`}
        >
          Ver todos
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando productos…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay productos para mostrar.</p>
      ) : (
        <Table columns={columns} data={rows} />
      )}

      <ConfirmModal
        open={productToDelete !== null}
        title="Eliminar producto"
        message={`¿Seguro que deseas eliminar "${productToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};

export default Catalogo;
