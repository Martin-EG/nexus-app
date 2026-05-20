'use client';

import Table from '@/components/Table';
import { useUserStore } from '@/data/user';
import { useEffect, useState } from 'react';

type Sale = {
  id: number;
  customerType: string;
  subtotal: number;
  total: number;
  status: string;
  createdAt: string;
};

const Ventas = () => {
  const userId = useUserStore((state) => state.user.db_id);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refundSale, setRefundSale] = useState<Sale | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSales = async () => {
    if (!userId) {
      setError('Inicia sesión para ver tus ventas.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/by-user/${userId}`);
      if (!res.ok) throw new Error();
      setSales(await res.json());
    } catch {
      setError('No se pudieron cargar las ventas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openRefund = (sale: Sale) => {
    setMessage('');
    setRefundSale(sale);
    setRefundAmount(String(sale.total));
  };

  const submitRefund = async () => {
    if (!refundSale) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/sales/${refundSale.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(refundAmount), items: [] }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessage(`Devolución registrada para la venta #${data.sale_id}.`);
      setRefundSale(null);
      setRefundAmount('');
    } catch {
      setError('No se pudo procesar la devolución.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    '#',
    'Tipo',
    'Subtotal',
    'Total',
    'Estado',
    'Fecha',
    'Acciones',
  ];
  const rows = sales.map((sale) => ({
    '#': sale.id,
    Tipo: sale.customerType,
    Subtotal: `$${sale.subtotal}`,
    Total: `$${sale.total}`,
    Estado: sale.status,
    Fecha: new Date(sale.createdAt).toLocaleDateString(),
    Acciones: (
      <button
        onClick={() => openRefund(sale)}
        className="rounded-md px-2 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Devolver
      </button>
    ),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Ventas
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando ventas…</p>
      ) : sales.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay ventas para mostrar.</p>
      ) : (
        <Table columns={columns} data={rows} />
      )}

      {refundSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRefundSale(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900">
              Devolver venta #{refundSale.id}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Indica el monto a devolver.
            </p>

            <input
              type="number"
              min={0}
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Monto"
              className="mt-4 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setRefundSale(null)}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void submitRefund()}
                disabled={submitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Procesando…' : 'Devolver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;
