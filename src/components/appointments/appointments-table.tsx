'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Row = {
  id: string;
  scheduledAt: string | Date;
  durationMin: number;
  timing: string;
  title: string;
  status: string;
  manager?: { firstName: string; lastName: string } | null;
  guest?: { firstName: string; lastName: string; email: string | null } | null;
  villa?: { name: string; slug: string } | null;
};

const STATUSES = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const statusBadge: Record<string, string> = {
  REQUESTED: 'bg-amber-500 text-white',
  CONFIRMED: 'bg-sky-600 text-white',
  COMPLETED: 'bg-emerald-600 text-white',
  CANCELLED: 'bg-muted text-muted-foreground',
};
const timingBadge: Record<string, string> = {
  BEFORE: 'bg-violet-600 text-white',
  DURING: 'bg-sky-600 text-white',
  AFTER: 'bg-teal-600 text-white',
};

export function AppointmentsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">No appointments yet.</p>;
  }

  return (
    <div className="rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="text-left text-muted-foreground">
            <th className="p-3 font-medium">When</th>
            <th className="p-3 font-medium">Stage</th>
            <th className="p-3 font-medium">Guest</th>
            <th className="p-3 font-medium">Manager</th>
            <th className="p-3 font-medium">Villa</th>
            <th className="p-3 font-medium">Title</th>
            <th className="p-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3 whitespace-nowrap" suppressHydrationWarning>
                {new Date(r.scheduledAt).toLocaleString()}
                <span className="text-muted-foreground"> · {r.durationMin}m</span>
              </td>
              <td className="p-3 whitespace-nowrap">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${timingBadge[r.timing] ?? 'bg-muted text-muted-foreground'}`}>
                  {r.timing}
                </span>
              </td>
              <td className="p-3 whitespace-nowrap">
                {r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : '—'}
              </td>
              <td className="p-3 whitespace-nowrap">
                {r.manager ? `${r.manager.firstName} ${r.manager.lastName}` : '—'}
              </td>
              <td className="p-3 whitespace-nowrap">{r.villa?.name ?? '—'}</td>
              <td className="p-3">{r.title}</td>
              <td className="p-3">
                <select
                  value={r.status}
                  disabled={busy === r.id}
                  onChange={(e) => setStatus(r.id, e.target.value)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 cursor-pointer disabled:opacity-60 ${statusBadge[r.status] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-background text-foreground">
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
