'use client';

import AdminMiddleware from '@/components/AdminMiddleware';
import Table from '@/components/Table';
import { useUserStore } from '@/data/user';
import { formatDate } from '@/lib/format-date';
import { useEffect, useState } from 'react';

type Notification = {
  id: number;
  message: string;
  kind: string;
  status: string;
  createdAt: string | null;
};

const KINDS = ['info', 'warn', 'alert', 'system', 'marketing'];

const inputClass =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200';

const Notifications = () => {
  const { db_id: userId } = useUserStore((state) => state.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastKind, setBroadcastKind] = useState('info');
  const [broadcastOut, setBroadcastOut] = useState('');

  const [createMsg, setCreateMsg] = useState('');
  const [createKind, setCreateKind] = useState('info');
  const [createOut, setCreateOut] = useState('');

  const refresh = async () => {
    if (!userId) {
      setError('Inicia sesión para ver tus notificaciones.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications/${userId}`);
      if (!res.ok) throw new Error();
      setNotifications(await res.json());
    } catch {
      setError('No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const markRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n)),
      );
    } catch {
      setError('No se pudo marcar como leída.');
    }
  };

  const remove = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError('No se pudo eliminar la notificación.');
    }
  };

  const broadcast = async () => {
    setBroadcastOut('');
    if (!broadcastMsg.trim()) return;
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMsg, kind: broadcastKind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setBroadcastOut(`Difundido a ${data.delivered} usuarios.`);
      setBroadcastMsg('');
    } catch {
      setBroadcastOut('No se pudo difundir.');
    }
  };

  const createNotification = async () => {
    setCreateOut('');
    if (!createMsg.trim() || !userId) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: createMsg,
          kind: createKind,
        }),
      });
      if (!res.ok) throw new Error();
      setCreateOut('Notificación creada.');
      setCreateMsg('');
      await refresh();
    } catch {
      setCreateOut('No se pudo crear la notificación.');
    }
  };

  const unread = notifications.filter((n) => n.status === 'unread').length;

  const columns = ['ID', 'Tipo', 'Mensaje', 'Estado', 'Fecha', 'Acción'];
  const rows = notifications.map((n) => ({
    ID: n.id,
    Tipo: n.kind,
    Mensaje: n.message,
    Estado: n.status,
    Fecha: formatDate(n.createdAt),
    Acción: (
      <div className="flex gap-1">
        {n.status !== 'read' && (
          <button
            onClick={() => markRead(n.id)}
            className="rounded-md px-2 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            Marcar leída
          </button>
        )}
        <button
          onClick={() => remove(n.id)}
          className="rounded-md px-2 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Eliminar
        </button>
      </div>
    ),
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900">
        Notificaciones
      </h1>
      <p className="mb-6 text-sm text-zinc-500">No leídas: {unread}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-3 flex justify-end">
        <button
          onClick={() => void refresh()}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Recargar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando notificaciones…</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay notificaciones.</p>
      ) : (
        <Table columns={columns} data={rows} />
      )}

      <AdminMiddleware>
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-medium text-zinc-900">
            Difusión masiva (admin)
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Mensaje"
              className={`${inputClass} min-w-[200px] flex-1`}
            />
            <select
              value={broadcastKind}
              onChange={(e) => setBroadcastKind(e.target.value)}
              className={inputClass}
            >
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
            <button
              onClick={() => void broadcast()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Difundir
            </button>
          </div>
          {broadcastOut && (
            <p className="mt-2 text-sm text-zinc-600">{broadcastOut}</p>
          )}
        </div>
      </AdminMiddleware>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-medium text-zinc-900">
          Crear notificación (a mí)
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={createMsg}
            onChange={(e) => setCreateMsg(e.target.value)}
            placeholder="Mensaje"
            className={`${inputClass} min-w-[200px] flex-1`}
          />
          <select
            value={createKind}
            onChange={(e) => setCreateKind(e.target.value)}
            className={inputClass}
          >
            {KINDS.slice(0, 3).map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
          <button
            onClick={() => void createNotification()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Crear
          </button>
        </div>
        {createOut && <p className="mt-2 text-sm text-zinc-600">{createOut}</p>}
      </div>
    </div>
  );
};

export default Notifications;
