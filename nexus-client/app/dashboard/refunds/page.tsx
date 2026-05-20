'use client';

import AdminMiddleware from '@/components/AdminMiddleware';
import Table from '@/components/Table';
import { useUserStore } from '@/data/user';
import { formatDate } from '@/lib/format-date';
import { useEffect, useState } from 'react';

type Refund = {
  id: number;
  saleId: number;
  reason: string;
  amount: number;
  status: string;
  createdAt: string | null;
};

const inputClass =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200';

const round2 = (value: number) => Math.round(value * 100) / 100;

const Refunds = () => {
  const { db_id: userId, is_admin } = useUserStore((state) => state.user);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [saleId, setSaleId] = useState('');
  const [reason, setReason] = useState('');
  const [createOut, setCreateOut] = useState('');

  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<Refund[]>([]);

  const refresh = async () => {
    if (!userId) {
      setError('Inicia sesión para ver tus devoluciones.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/refunds/by-user/${userId}`);
      if (!res.ok) throw new Error();
      setRefunds(await res.json());
    } catch {
      setError('No se pudieron cargar las devoluciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const createRefund = async () => {
    setCreateOut('');
    const sid = parseInt(saleId, 10);
    if (!sid || !reason.trim() || !userId) {
      setCreateOut('Indica el ID de venta y el motivo.');
      return;
    }
    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale_id: sid, reason, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setCreateOut(
        `Devolución #${data.refund_id} solicitada (monto ${data.amount}).`,
      );
      setSaleId('');
      setReason('');
      await refresh();
    } catch {
      setCreateOut('No se pudo solicitar la devolución.');
    }
  };

  const approve = async (rid: number) => {
    try {
      const res = await fetch(`/api/refunds/${rid}/approve`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const status = (data.status as string) ?? 'Approved';
      setRefunds((prev) =>
        prev.map((r) => (r.id === rid ? { ...r, status } : r)),
      );
      setSearchResults((prev) =>
        prev.map((r) => (r.id === rid ? { ...r, status } : r)),
      );
    } catch {
      setError('No se pudo aprobar la devolución.');
    }
  };

  const search = async () => {
    try {
      const res = await fetch(
        `/api/refunds/search?q=${encodeURIComponent(searchQ)}`,
      );
      if (!res.ok) throw new Error();
      setSearchResults(await res.json());
    } catch {
      setError('La búsqueda falló.');
    }
  };

  const columns = [
    'ID',
    'Sale',
    'Motivo',
    'Monto',
    'IVA',
    'Total',
    'Estado',
    'Fecha',
    'Acción',
  ];
  // The API stores only `amount`; IVA (16%) and Total are derived here for
  // display, mirroring the backend's getIvaBreakdown helper.
  const toRow = (refund: Refund) => {
    const amount = Number(refund.amount) || 0;
    const iva = round2(amount * 0.16);
    return {
      ID: refund.id,
      Sale: refund.saleId,
      Motivo: refund.reason,
      Monto: amount.toFixed(2),
      IVA: iva.toFixed(2),
      Total: (amount + iva).toFixed(2),
      Estado: refund.status,
      Fecha: formatDate(refund.createdAt),
      Acción:
        is_admin && refund.status === 'pending' ? (
          <button
            onClick={() => approve(refund.id)}
            className="rounded-md px-2 py-1 text-sm font-medium text-green-700 transition-colors hover:bg-green-50"
          >
            Aprobar
          </button>
        ) : (
          '—'
        ),
    };
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Devoluciones
      </h1>

      <h2 className="mb-3 text-lg font-medium text-zinc-900">
        Crear devolución
      </h2>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          value={saleId}
          onChange={(e) => setSaleId(e.target.value)}
          type="number"
          placeholder="ID de venta"
          aria-label="ID de venta"
          className={`${inputClass} w-40`}
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo"
          aria-label="Motivo de la devolución"
          className={`${inputClass} min-w-[200px] flex-1`}
        />
        <button
          onClick={() => void createRefund()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Solicitar
        </button>
      </div>
      {createOut && (
        <p role="status" className="mb-4 text-sm text-zinc-600">
          {createOut}
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900">Mis devoluciones</h2>
        <button
          onClick={() => void refresh()}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Recargar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando devoluciones…</p>
      ) : refunds.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay devoluciones.</p>
      ) : (
        <Table columns={columns} data={refunds.map(toRow)} />
      )}

      <AdminMiddleware>
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-medium text-zinc-900">
            Buscar devoluciones (admin)
          </h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void search();
              }}
              placeholder="Buscar por motivo"
              aria-label="Buscar devoluciones por motivo"
              className={`${inputClass} min-w-[200px] flex-1`}
            />
            <button
              onClick={() => void search()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Buscar
            </button>
          </div>
          {searchResults.length > 0 && (
            <Table columns={columns} data={searchResults.map(toRow)} />
          )}
        </div>
      </AdminMiddleware>
    </div>
  );
};

export default Refunds;
