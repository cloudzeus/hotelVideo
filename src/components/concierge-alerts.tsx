'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Item = { id: string; label: string; href: string };

// Polls pending guest requests/calls for the signed-in staff member and raises a
// toast (+ a short sound) for each NEW one, so staff are alerted without staring
// at the dashboard. Pre-existing items on first load are recorded silently.
export function ConciergeAlerts() {
  const router = useRouter();
  const seen = useRef<Set<string> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audio.current = new Audio('/ring.mp3');
    let active = true;

    const tick = async () => {
      try {
        const r = await fetch('/api/alerts/pending', { cache: 'no-store' });
        if (!r.ok) return; // 401 when signed out → stay silent
        const d = await r.json();
        const items: Item[] = [
          ...d.concierge.map((c: { id: string; title: string }) => ({
            id: `sr-${c.id}`,
            label: c.title || 'Επισκέπτης περιμένει στο reception',
            href: '/service-requests',
          })),
          ...d.appointments.map((a: { id: string; guest: string }) => ({
            id: `ap-${a.id}`,
            label: `Νέο αίτημα ραντεβού${a.guest ? ` — ${a.guest}` : ''}`,
            href: '/appointments',
          })),
        ];

        if (seen.current === null) {
          seen.current = new Set(items.map((i) => i.id)); // silent on first load
          return;
        }
        for (const it of items) {
          if (!seen.current.has(it.id)) {
            seen.current.add(it.id);
            audio.current?.play().catch(() => {});
            toast(it.label, {
              description: 'Νέο αίτημα από την ιστοσελίδα',
              duration: 10000,
              action: { label: 'Άνοιγμα', onClick: () => router.push(it.href) },
            });
          }
        }
      } catch {
        /* network hiccup — retry next tick */
      }
    };

    tick();
    const id = setInterval(() => active && tick(), 20000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [router]);

  return null;
}
