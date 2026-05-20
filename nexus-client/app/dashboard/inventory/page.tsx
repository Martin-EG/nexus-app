'use client';

import Table from '@/components/Table';
import { useEffect, useMemo, useState } from 'react';

type InventoryRow = {
  id: number;
  name: string;
  sku: string;
  warehouse: string | null;
  quantity: number | null;
};

const Inventory = () => {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      setError('No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        item.name.toLowerCase().includes(filter.toLowerCase()),
      ),
    [items, filter],
  );

  const columns = ['SKU', 'Producto', 'Bodega', 'Stock'];
  const rows = filtered.map((item) => ({
    SKU: item.sku,
    Producto: item.name,
    Bodega: item.warehouse ?? '—',
    Stock: item.quantity ?? 0,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Inventario
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por nombre"
          className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
        />
        <button
          onClick={() => void reload()}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Recargar
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando inventario…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay registros para mostrar.</p>
      ) : (
        <Table columns={columns} data={rows} />
      )}
    </div>
  );
};

export default Inventory;
