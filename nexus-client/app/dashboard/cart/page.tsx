'use client';

import Table from '@/components/Table';
import { useUserStore } from '@/data/user';
import { useState } from 'react';

type CartItem = {
  product_id: number;
  qty: number;
  name: string;
  price: number;
};

const Cart = () => {
  const userId = useUserStore((state) => state.user.db_id);
  const [items, setItems] = useState<CartItem[]>([]);
  const [pid, setPid] = useState('');
  const [qty, setQty] = useState('1');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addItem = async () => {
    setError('');
    setMessage('');
    const productId = parseInt(pid, 10);
    const quantity = parseInt(qty, 10);
    if (!productId || !quantity || quantity < 1) {
      setError('Ingresa un ID de producto y una cantidad válidos.');
      return;
    }
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error();
      const product = await res.json();
      setItems((prev) => [
        ...prev,
        {
          product_id: productId,
          qty: quantity,
          name: product.name,
          price: product.price,
        },
      ]);
      setPid('');
      setQty('1');
    } catch {
      setError('Producto no encontrado.');
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const iva = Math.round(subtotal * 0.16 * 10000) / 10000;
  const total = subtotal + iva;

  const checkout = async () => {
    if (items.length === 0) return;
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          customer_type: 'NORMAL',
          items: items.map((item) => ({
            product_id: item.product_id,
            qty: item.qty,
            warehouse_id: 1,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessage(`Venta #${data.sale_id} confirmada — total ${data.total}`);
      setItems([]);
    } catch {
      setError('No se pudo confirmar la venta.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200';

  const columns = ['Producto', 'Cant', 'Precio', 'Subtotal'];
  const rows = items.map((item) => ({
    Producto: item.name,
    Cant: item.qty,
    Precio: `$${item.price}`,
    Subtotal: `$${(item.price * item.qty).toFixed(4)}`,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Carrito
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={pid}
          onChange={(e) => setPid(e.target.value)}
          placeholder="ID de producto"
          inputMode="numeric"
          className={`${inputClass} w-40`}
        />
        <input
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          type="number"
          min={1}
          placeholder="Cantidad"
          className={`${inputClass} w-32`}
        />
        <button
          onClick={() => void addItem()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Agregar
        </button>
      </div>

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

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">El carrito está vacío.</p>
      ) : (
        <>
          <Table columns={columns} data={rows} />

          <div className="mt-4 space-y-1 text-sm text-zinc-700">
            <p>
              Subtotal:{' '}
              <span className="font-medium">${subtotal.toFixed(4)}</span>
            </p>
            <p>
              IVA (16%): <span className="font-medium">${iva.toFixed(4)}</span>
            </p>
            <p className="text-base text-zinc-900">
              Total: <span className="font-semibold">${total.toFixed(4)}</span>
            </p>
          </div>

          <button
            onClick={() => void checkout()}
            disabled={submitting}
            className="mt-4 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Confirmando…' : 'Confirmar venta'}
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;
