'use client';

import AdminMiddleware from '@/components/AdminMiddleware';
import Table from '@/components/Table';
import { useState } from 'react';

const inputClass =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200';
const buttonClass =
  'rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700';

type PivotRow = {
  dim_a: string;
  dim_b: string;
  n_sales: string | number;
  gross: number;
  effective: number;
  after_volume: number;
};

const Exportes = () => {
  const [pivotYear, setPivotYear] = useState('2025');
  const [dimA, setDimA] = useState('customer_type');
  const [dimB, setDimB] = useState('category');
  const [pivot, setPivot] = useState<PivotRow[]>([]);
  const [pivotError, setPivotError] = useState('');

  const [totalsYear, setTotalsYear] = useState('2025');
  const [totalsCt, setTotalsCt] = useState('');
  const [totalsOut, setTotalsOut] = useState('');

  const [csvCustomerType, setCsvCustomerType] = useState('');
  const [csvOut, setCsvOut] = useState('');

  const loadPivot = async () => {
    setPivotError('');
    try {
      const res = await fetch(
        `/api/exports/pivot?year=${pivotYear}&a=${dimA}&b=${dimB}`,
      );
      if (!res.ok) throw new Error();
      setPivot(await res.json());
    } catch {
      setPivot([]);
      setPivotError('No se pudo generar el pivot.');
    }
  };

  const loadTotals = async () => {
    setTotalsOut('Cargando…');
    try {
      const params = new URLSearchParams({ year: totalsYear });
      if (totalsCt) params.set('customer_type', totalsCt);
      const res = await fetch(`/api/exports/totals?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setTotalsOut(JSON.stringify(data, null, 2));
    } catch {
      setTotalsOut('No se pudieron calcular los totales.');
    }
  };

  const downloadCsv = async () => {
    setCsvOut('Cargando…');
    try {
      const params = new URLSearchParams();
      if (csvCustomerType) params.set('customer_type', csvCustomerType);
      const res = await fetch(`/api/exports/csv?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error();
      setCsvOut(data.csv ?? JSON.stringify(data, null, 2));
    } catch {
      setCsvOut('No se pudo descargar el CSV.');
    }
  };

  const num = (value: unknown) => Number(value ?? 0).toFixed(2);
  const pivotColumns = [
    'dim_a',
    'dim_b',
    'ventas',
    'gross',
    'effective',
    'after_volume',
  ];
  const pivotRows = pivot.map((row) => ({
    dim_a: row.dim_a,
    dim_b: row.dim_b,
    ventas: row.n_sales,
    gross: num(row.gross),
    effective: num(row.effective),
    after_volume: num(row.after_volume),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
        Exportes — Pivot
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={pivotYear}
          onChange={(e) => setPivotYear(e.target.value)}
          type="number"
          aria-label="Año del pivot"
          className={`${inputClass} w-28`}
        />
        <select
          value={dimA}
          onChange={(e) => setDimA(e.target.value)}
          aria-label="Dimensión A"
          className={inputClass}
        >
          <option value="customer_type">customer_type</option>
          <option value="status">status</option>
          <option value="user_id">user_id</option>
        </select>
        <select
          value={dimB}
          onChange={(e) => setDimB(e.target.value)}
          aria-label="Dimensión B"
          className={inputClass}
        >
          <option value="category">category</option>
          <option value="supplier_id">supplier_id</option>
          <option value="warehouse_id">warehouse_id</option>
        </select>
        <button onClick={() => void loadPivot()} className={buttonClass}>
          Generar pivot
        </button>
      </div>

      {pivotError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {pivotError}
        </div>
      )}
      {pivot.length > 0 && <Table columns={pivotColumns} data={pivotRows} />}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-medium text-zinc-900">Totales</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={totalsYear}
            onChange={(e) => setTotalsYear(e.target.value)}
            type="number"
            aria-label="Año de los totales"
            className={`${inputClass} w-28`}
          />
          <input
            value={totalsCt}
            onChange={(e) => setTotalsCt(e.target.value)}
            placeholder="customer_type (opcional)"
            aria-label="Tipo de cliente (opcional)"
            className={inputClass}
          />
          <button onClick={() => void loadTotals()} className={buttonClass}>
            Calcular
          </button>
        </div>
        {totalsOut && (
          <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-800">
            {totalsOut}
          </pre>
        )}
      </div>

      <AdminMiddleware>
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-medium text-zinc-900">
            Descargar CSV (admin)
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={csvCustomerType}
              onChange={(e) => setCsvCustomerType(e.target.value)}
              placeholder="customer_type (opcional)"
              aria-label="Tipo de cliente (opcional)"
              className={`${inputClass} min-w-[200px] flex-1`}
            />
            <button onClick={() => void downloadCsv()} className={buttonClass}>
              Descargar
            </button>
          </div>
          {csvOut && (
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-800">
              {csvOut}
            </pre>
          )}
        </div>
      </AdminMiddleware>
    </div>
  );
};

export default Exportes;
