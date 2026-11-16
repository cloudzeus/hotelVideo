'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Opt = { id: string; label: string };

export function CreateAppointmentButton({
  managers,
  villas,
  guests,
}: {
  managers: Opt[];
  villas: Opt[];
  guests: Opt[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({
    managerId: managers[0]?.id ?? '',
    guestId: '',
    villaId: '',
    timing: 'DURING',
    title: '',
    scheduledAt: '',
    durationMin: 30,
  });

  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));
  const field = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  async function submit() {
    if (!f.managerId || !f.title.trim() || !f.scheduledAt) {
      setError('Manager, title and date/time are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...f,
          guestId: f.guestId || null,
          villaId: f.villaId || null,
          scheduledAt: new Date(f.scheduledAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Could not create appointment');
      setOpen(false);
      setF((p) => ({ ...p, title: '', scheduledAt: '', guestId: '', villaId: '' }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> New appointment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>Schedule a manager appointment before, during or after a stay.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Title *</label>
            <input className={field} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Pre-arrival concierge call" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Manager *</label>
              <select className={field} value={f.managerId} onChange={(e) => set('managerId', e.target.value)}>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Stage</label>
              <select className={field} value={f.timing} onChange={(e) => set('timing', e.target.value)}>
                <option value="BEFORE">Before stay</option>
                <option value="DURING">During stay</option>
                <option value="AFTER">After stay</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">When *</label>
              <input type="datetime-local" className={field} value={f.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Duration (min)</label>
              <input type="number" min={5} step={5} className={field} value={f.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Guest</label>
              <select className={field} value={f.guestId} onChange={(e) => set('guestId', e.target.value)}>
                <option value="">—</option>
                {guests.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Villa</label>
              <select className={field} value={f.villaId} onChange={(e) => set('villaId', e.target.value)}>
                <option value="">—</option>
                {villas.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
