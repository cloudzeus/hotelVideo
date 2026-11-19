'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video, PhoneIncoming, Loader2 } from 'lucide-react';

type Request = { id: string; guest: string; scheduledAt: string };

const whenFmt = new Intl.DateTimeFormat('el-GR', {
  timeZone: 'Europe/Athens',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

// Polls pending guest video-meeting requests for the signed-in staff member and
// pops a notification window for each new one, from which staff can accept the
// request (which mints the room + emails the guest) and jump straight into the
// call. Pre-existing items on first load are recorded silently.
export function ConciergeAlerts() {
  const router = useRouter();
  const seen = useRef<Set<string> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [req, setReq] = useState<Request | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    audio.current = new Audio('/ring.mp3');
    let active = true;

    const tick = async () => {
      try {
        const r = await fetch('/api/alerts/pending', { cache: 'no-store' });
        if (!r.ok) return; // 401 when signed out → stay silent
        const d = await r.json();
        const appts: Request[] = (d.appointments ?? []).map((a: Request) => ({ id: a.id, guest: a.guest, scheduledAt: a.scheduledAt }));
        const concierge: { id: string; title: string }[] = d.concierge ?? [];

        const ids = [...appts.map((a) => `ap-${a.id}`), ...concierge.map((c) => `sr-${c.id}`)];
        if (seen.current === null) {
          seen.current = new Set(ids); // silent on first load
          return;
        }

        for (const a of appts) {
          const key = `ap-${a.id}`;
          if (!seen.current.has(key)) {
            seen.current.add(key);
            audio.current?.play().catch(() => {});
            setReq(a); // notification window with accept-and-join
          }
        }
        // Legacy instant "reception" signals (no longer created from the site) → toast.
        for (const c of concierge) {
          const key = `sr-${c.id}`;
          if (!seen.current.has(key)) {
            seen.current.add(key);
            toast(c.title || 'Αίτημα concierge', { action: { label: 'Άνοιγμα', onClick: () => router.push('/service-requests') } });
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

  const close = () => {
    audio.current?.pause();
    setReq(null);
  };

  const acceptAndJoin = async () => {
    if (!req) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/appointments/${req.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Αποτυχία');
      audio.current?.pause();
      toast.success('Το αίτημα έγινε αποδεκτό', { description: 'Στάλθηκε σύνδεσμος στον επισκέπτη.' });
      if (data.roomSlug) window.open(`/room/${data.roomSlug}`, '_blank', 'noopener,noreferrer');
      setReq(null);
    } catch (e) {
      toast.error('Σφάλμα', { description: e instanceof Error ? e.message : 'Η αποδοχή απέτυχε' });
    } finally {
      setBusy(false);
    }
  };

  if (!req) return null;

  const when = req.scheduledAt ? whenFmt.format(new Date(req.scheduledAt)) : '';

  return (
    <Dialog open={!!req} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneIncoming className="h-5 w-5 text-primary" /> Νέο αίτημα βιντεοκλήσης
          </DialogTitle>
          <DialogDescription>
            {req.guest ? `${req.guest} · ` : ''}{when}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Αποδέξου το αίτημα για να σταλεί ο σύνδεσμος στον επισκέπτη και να μπεις στην αίθουσα.
        </p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => { router.push('/appointments'); close(); }} disabled={busy}>
            Προβολή
          </Button>
          <Button onClick={acceptAndJoin} disabled={busy} className="flex items-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            Αποδοχή & είσοδος
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
