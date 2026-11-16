'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Row = {
  id: string;
  createdAt: string | Date;
  category: string;
  title: string;
  body: string;
  status: string;
  source: string;
  guest?: { firstName: string; lastName: string; email: string | null } | null;
  villa?: { name: string; slug: string } | null;
  assignee?: { firstName: string; lastName: string } | null;
};

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];
const statusBadge: Record<string, string> = {
  OPEN: 'bg-amber-500 text-white',
  IN_PROGRESS: 'bg-sky-600 text-white',
  RESOLVED: 'bg-emerald-600 text-white',
  CANCELLED: 'bg-muted text-muted-foreground',
};

export function ServiceRequestsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      await fetch(`/api/service-requests/${id}`, {
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
    return <p className="text-muted-foreground py-8 text-center">No service requests yet.</p>;
  }

  return (
    <div className="rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card">
          <tr className="text-left text-muted-foreground">
            <th className="p-3 font-medium">Created</th>
            <th className="p-3 font-medium">Guest</th>
            <th className="p-3 font-medium">Villa</th>
            <th className="p-3 font-medium">Category</th>
            <th className="p-3 font-medium">Request</th>
            <th className="p-3 font-medium">Source</th>
            <th className="p-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border align-top">
              <td className="p-3 whitespace-nowrap text-muted-foreground" suppressHydrationWarning>
                {new Date(r.createdAt).toLocaleDateString()}
              </td>
              <td className="p-3 whitespace-nowrap">
                {r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : '—'}
              </td>
              <td className="p-3 whitespace-nowrap">{r.villa?.name ?? '—'}</td>
              <td className="p-3 whitespace-nowrap">{r.category.replace('_', ' ')}</td>
              <td className="p-3">
                <div className="font-medium">{r.title}</div>
                <div className="text-muted-foreground line-clamp-2 max-w-md">{r.body}</div>
              </td>
              <td className="p-3 text-muted-foreground">{r.source}</td>
              <td className="p-3">
                <select
                  value={r.status}
                  disabled={busy === r.id}
                  onChange={(e) => setStatus(r.id, e.target.value)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 cursor-pointer disabled:opacity-60 ${statusBadge[r.status] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-background text-foreground">
                      {s.replace('_', ' ')}
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
