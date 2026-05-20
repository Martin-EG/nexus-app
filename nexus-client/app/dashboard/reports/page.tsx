'use client';

import AdminMiddleware from '@/components/AdminMiddleware';
import Table from '@/components/Table';
import { formatDate } from '@/lib/format-date';
import { useEffect, useState } from 'react';

type MonthlyRow = {
  id: number;
  user_id: number;
  username: string | null;
  customer_type: string;
  product_name: string;
  qty: number;
  unit_price: number;
  effective_subtotal: number | null;
  line_after_discount: number | null;
  created_at: string;
};

const inputClass =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200';

const Reportes = () => {
  const [total, setTotal] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');

  const [year, setYear] = useState('2025');
  const [month, setMonth] = useState('1');
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState('');

  const [exportType, setExportType] = useState('sales');
  const [exportFilter, setExportFilter] = useState('0');
  const [exportOutput, setExportOutput] = useState('');

  const refresh = async () => {
    const now = new Date();
    try {
      const res = await fetch(
        `/api/reports/total?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTotal(data.total);
      setLastUpdated(now.toLocaleTimeString());
    } catch {
      // Log issue
    }
  };

  const loadMonthly = async () => {
    setMonthlyError('');
    setMonthlyLoading(true);
    try {
      const res = await fetch(
        `/api/reports/monthly?year=${year || '2025'}&month=${month || '1'}`,
      );
      if (!res.ok) throw new Error();
      setMonthly(await res.json());
    } catch {
      setMonthly([]);
      setMonthlyError('Error al cargar el reporte.');
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    void loadMonthly();
    const timer = setInterval(() => void refresh(), 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportData = async () => {
    setExportOutput('Cargando…');
    try {
      const res = await fetch(
        `/api/reports/export?type=${exportType}&filter=${encodeURIComponent(exportFilter)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error();
      setExportOutput(JSON.stringify(data, null, 2));
    } catch {
      setExportOutput('Error al exportar.');
    }
  };

  const columns = [
    'Venta',
    'Usuario',
    'Tipo cliente',
    'Producto',
    'Cant',
    'Precio',
    'Subtotal efectivo',
    'Línea c/desc',
    'Fecha',
  ];
  const rows = monthly.map((row) => ({
    Venta: row.id,
    Usuario: row.username ?? row.user_id,
    'Tipo cliente': row.customer_type ?? '',
    Producto: row.product_name ?? '',
    Cant: row.qty,
    Precio: row.unit_price,
    'Subtotal efectivo':
      row.effective_subtotal != null
        ? Number(row.effective_subtotal).toFixed(2)
        : '',
    'Línea c/desc':
      row.line_after_discount != null
        ? Number(row.line_after_discount).toFixed(2)
        : '',
    Fecha: formatDate(row.created_at),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Reportes
      </h1>

      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-500">Total ventas mes actual</p>
        <p className="mt-1 text-3xl font-semibold text-zinc-900">
          {total != null ? `$${total}` : '…'}
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          Última actualización: {lastUpdated || '…'}
        </p>
      </div>

      <h2 className="mb-3 text-lg font-medium text-zinc-900">
        Detalle del mes
      </h2>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          type="number"
          placeholder="Año"
          aria-label="Año"
          className={`${inputClass} w-28`}
        />
        <input
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          type="number"
          min={1}
          max={12}
          placeholder="Mes"
          aria-label="Mes"
          className={`${inputClass} w-24`}
        />
        <button
          onClick={() => void loadMonthly()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Ver mes
        </button>
      </div>

      {monthlyError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {monthlyError}
        </div>
      )}

      {monthlyLoading ? (
        <p className="text-sm text-zinc-500">Cargando reporte…</p>
      ) : monthly.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay registros para el mes.</p>
      ) : (
        <>
          <Table columns={columns} data={rows} />
          <p className="mt-2 text-sm text-zinc-500">
            {monthly.length} registros
          </p>
        </>
      )}

      <AdminMiddleware>
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-medium text-zinc-900">
            Exportar (admin)
          </h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              aria-label="Tipo de reporte"
              className={inputClass}
            >
              <option value="sales">Ventas</option>
              <option value="inventory">Inventario</option>
            </select>
            <input
              value={exportFilter}
              onChange={(e) => setExportFilter(e.target.value)}
              placeholder="Filtro"
              aria-label="Filtro (ID mínimo)"
              className={`${inputClass} w-28`}
            />
            <button
              onClick={() => void exportData()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Exportar
            </button>
          </div>
          {exportOutput && (
            <pre className="max-h-96 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-800">
              {exportOutput}
            </pre>
          )}
        </div>
      </AdminMiddleware>
    </div>
  );
};

export default Reportes;
