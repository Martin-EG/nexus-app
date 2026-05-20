'use client';

import Table from '@/components/Table';
import { formatDate } from '@/lib/format-date';
import { useEffect, useState } from 'react';

type Supplier = { id: number; name: string };

type PurchaseRow = {
  id: number;
  supplier_id: number;
  supplier_name: string | null;
  total: number;
  received_date: string;
  status: string;
  bank_ref: string | null;
};

const inputClass =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200';

const Compras = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      if (!res.ok) throw new Error();
      setSuppliers(await res.json());
    } catch {
      setError('No se pudieron cargar los proveedores.');
    }
  };

  const loadPurchases = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      if (!res.ok) throw new Error();
      setPurchases(await res.json());
    } catch {
      setError('No se pudieron cargar las compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
    void loadPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitPurchase = async () => {
    setError('');
    setMessage('');
    const supplier = parseInt(supplierId, 10);
    const product = parseInt(productId, 10);
    const quantity = parseInt(qty, 10);
    const cost = parseFloat(unitCost);
    if (!supplier || !product || !quantity || !cost || !receivedDate) {
      setError('Completa todos los campos.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: supplier,
          received_date: receivedDate,
          items: [
            {
              product_id: product,
              qty: quantity,
              unit_cost: cost,
              warehouse_id: 1,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessage(`Compra #${data.purchase_id} registrada.`);
      setSupplierId('');
      setProductId('');
      setQty('');
      setUnitCost('');
      setReceivedDate('');
      await loadPurchases();
    } catch {
      setError('No se pudo registrar la compra.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    'ID',
    'Proveedor',
    'Total',
    'Recibida',
    'Estado',
    'Ref. bancaria',
  ];
  const rows = purchases.map((purchase) => ({
    ID: purchase.id,
    Proveedor: purchase.supplier_name ?? '—',
    Total: `$${purchase.total}`,
    Recibida: formatDate(purchase.received_date),
    Estado: purchase.status,
    'Ref. bancaria': purchase.bank_ref ?? '—',
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Compras
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          aria-label="Proveedor"
          className={inputClass}
        >
          <option value="">Proveedor…</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="ID de producto"
          aria-label="ID de producto"
          inputMode="numeric"
          className={`${inputClass} w-36`}
        />
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          type="number"
          min={1}
          placeholder="Cantidad"
          aria-label="Cantidad"
          className={`${inputClass} w-28`}
        />
        <input
          value={unitCost}
          onChange={(e) => setUnitCost(e.target.value)}
          type="number"
          min={0}
          step="0.01"
          placeholder="Costo unitario"
          aria-label="Costo unitario"
          className={`${inputClass} w-36`}
        />
        <input
          value={receivedDate}
          onChange={(e) => setReceivedDate(e.target.value)}
          type="date"
          aria-label="Fecha de recepción"
          className={inputClass}
        />
        <button
          onClick={() => void submitPurchase()}
          disabled={submitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {submitting ? 'Registrando…' : 'Registrar'}
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
      {message && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {message}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900">Compras recientes</h2>
        <button
          onClick={() => void loadPurchases()}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Recargar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando compras…</p>
      ) : purchases.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay compras para mostrar.</p>
      ) : (
        <Table columns={columns} data={rows} />
      )}
    </div>
  );
};

export default Compras;
