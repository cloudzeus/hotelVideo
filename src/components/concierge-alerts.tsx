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
import { Video, PhoneIncoming, CalendarClock, Loader2 } from 'lucide-react';
import { useCallModal } from '@/components/call/call-modal-provider';

// Two distinct concierge paths, each with its own alert:
//  • a SCHEDULED meeting request (REQUESTED appointment) → "Αποδοχή" only
//    confirms it (mints room + emails the guest the link & time); nobody joins
//    now — both join at the slot time.
//  • an INSTANT call (OPEN CONCIERGE service request, "μίλα τώρα") → "Σύνδεση
//    τώρα" opens the reception room to serve the waiting guest immediately.
type Alert =
  | { kind: 'request'; id: string; guest: string; scheduledAt: string }
  | { kind: 'instant'; id: string; title: string };

const whenFmt = new Intl.DateTimeFormat('el-GR', {
  timeZone: 'Europe/Athens',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function ConciergeAlerts() {
  const router = useRouter();
  const { openCall } = useCallModal();
  const seen = useRef<Set<string> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    audio.current = new Audio('/ring.mp3');
    let active = true;

    const tick = async () => {
      try {
        const r = await fetch('/api/alerts/pending', { cache: 'no-store' });
        if (!r.ok) return; // 401 when signed out → stay silent
        const d = await r.json();
        const appts = (d.appointments ?? []) as { id: string; guest: string; scheduledAt: string }[];
        const instant = (d.concierge ?? []) as { id: string; title: string }[];

        const ids = [...appts.map((a) => `ap-${a.id}`), ...instant.map((c) => `sr-${c.id}`)];
        if (seen.current === null) {
          seen.current = new Set(ids); // silent on first load
          return;
        }
        // Instant calls take priority (someone is waiting right now).
        for (const c of instant) {
          if (!seen.current.has(`sr-${c.id}`)) {
            seen.current.add(`sr-${c.id}`);
            audio.current?.play().catch(() => {});
            setAlert({ kind: 'instant', id: c.id, title: c.title });
          }
        }
        for (const a of appts) {
          if (!seen.current.has(`ap-${a.id}`)) {
            seen.current.add(`ap-${a.id}`);
            audio.current?.play().catch(() => {});
            setAlert((cur) => cur ?? { kind: 'request', id: a.id, guest: a.guest, scheduledAt: a.scheduledAt });
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
    setAlert(null);
  };

  const confirmRequest = async (id: string) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Αποτυχία');
      toast.success('Το ραντεβού επιβεβαιώθηκε', { description: 'Στάλθηκε ο σύνδεσμος και η ώρα στον επισκέπτη.' });
      close();
    } catch (e) {
      toast.error('Σφάλμα', { description: e instanceof Error ? e.message : 'Η επιβεβαίωση απέτυχε' });
    } finally {
      setBusy(false);
    }
  };

  const joinInstant = () => {
    audio.current?.pause();
    openCall('reception');
    setAlert(null);
  };

  if (!alert) return null;

  if (alert.kind === 'instant') {
    return (
      <Dialog open onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneIncoming className="h-5 w-5 text-primary" /> Εισερχόμενη κλήση τώρα
            </DialogTitle>
            <DialogDescription>{alert.title}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Ένας επισκέπτης περιμένει στην αίθουσα. Συνδέσου για να τον εξυπηρετήσεις.</p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={close}>Αργότερα</Button>
            <Button onClick={joinInstant} className="flex items-center gap-2">
              <Video className="h-4 w-4" /> Σύνδεση τώρα
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const when = alert.scheduledAt ? whenFmt.format(new Date(alert.scheduledAt)) : '';
  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" /> Νέο αίτημα ραντεβού
          </DialogTitle>
          <DialogDescription>{alert.guest ? `${alert.guest} · ` : ''}{when}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Με την αποδοχή στέλνεται στον επισκέπτη ο σύνδεσμος και η ώρα. Η κλήση γίνεται την ώρα του ραντεβού (από τα Ραντεβού).
        </p>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => { router.push('/appointments'); close(); }} disabled={busy}>
            Προβολή
          </Button>
          <Button onClick={() => confirmRequest(alert.id)} disabled={busy} className="flex items-center gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
            Αποδοχή
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
