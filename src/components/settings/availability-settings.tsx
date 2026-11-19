'use client';

import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Day = { enabled: boolean; start: string; end: string };
type Days = Record<number, Day>;

// 0=Sunday … 6=Saturday (JS getDay()); display Monday-first.
const LABELS: Record<number, string> = { 1: 'Δευτέρα', 2: 'Τρίτη', 3: 'Τετάρτη', 4: 'Πέμπτη', 5: 'Παρασκευή', 6: 'Σάββατο', 0: 'Κυριακή' };
const ORDER = [1, 2, 3, 4, 5, 6, 0];
// 24-hour options every 30 min (native <input type=time> shows AM/PM per the
// browser locale; a select guarantees 24h and matches the fixed slot length).
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const timeClass = 'h-9 w-28 rounded-md border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50';

export function AvailabilitySettings() {
  const [days, setDays] = useState<Days | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings/availability')
      .then((r) => r.json())
      .then((d) => setDays(d.availability?.days ?? null))
      .catch(() => toast.error('Αποτυχία φόρτωσης ωραρίου'));
  }, []);

  const set = (d: number, patch: Partial<Day>) => setDays((prev) => (prev ? { ...prev, [d]: { ...prev[d]!, ...patch } } : prev));

  const save = async () => {
    if (!days) return;
    setSaving(true);
    try {
      const res = await fetch('/api/settings/availability', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Αποτυχία');
      toast.success('Το ωράριο αποθηκεύτηκε');
    } catch (e) {
      toast.error('Σφάλμα', { description: e instanceof Error ? e.message : 'Αποτυχία αποθήκευσης' });
    } finally {
      setSaving(false);
    }
  };

  if (!days) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Φόρτωση…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Όρισε τις μέρες και ώρες εξυπηρέτησης. Οι ώρες σπάνε αυτόματα σε slots των 30 λεπτών για τα ραντεβού από την ιστοσελίδα.
      </p>
      <div className="space-y-2">
        {ORDER.map((d) => {
          const day = days[d]!;
          return (
            <div key={d} className="flex items-center gap-3 rounded-md border border-border p-3">
              <Switch checked={day.enabled} onCheckedChange={(v) => set(d, { enabled: v })} />
              <span className="w-24 text-sm font-medium">{LABELS[d]}</span>
              <select
                value={day.start}
                disabled={!day.enabled}
                onChange={(e) => set(d, { start: e.target.value })}
                className={timeClass}
                aria-label={`Έναρξη ${LABELS[d]}`}
              >
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-muted-foreground">—</span>
              <select
                value={day.end}
                disabled={!day.enabled}
                onChange={(e) => set(d, { end: e.target.value })}
                className={timeClass}
                aria-label={`Λήξη ${LABELS[d]}`}
              >
                {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          );
        })}
      </div>
      <Button onClick={save} disabled={saving} className="flex items-center gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Αποθήκευση
      </Button>
    </div>
  );
}
