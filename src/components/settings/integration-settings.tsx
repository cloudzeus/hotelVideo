'use client';

import { useEffect, useState } from 'react';
import { FiVideo, FiHardDrive, FiZap, FiMail, FiCheckCircle, FiXCircle, FiSave } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';

type Svc = 'stream' | 'bunny' | 'openrouter' | 'mailgun';
type TestResult = { ok: boolean; status: number; detail: string };

const META: Record<Svc, { title: string; Icon: typeof FiVideo; color: string }> = {
  stream: { title: 'Βιντεοκλήσεις (Stream.io)', Icon: FiVideo, color: '#0078D4' },
  bunny: { title: 'Bunny CDN', Icon: FiHardDrive, color: '#F59E0B' },
  openrouter: { title: 'OpenRouter (AI)', Icon: FiZap, color: '#8B5CF6' },
  mailgun: { title: 'Mailgun (Email)', Icon: FiMail, color: '#E31E2A' },
};

// field key, label, secret?
const FIELDS: Record<Svc, [string, string, boolean][]> = {
  stream: [
    ['apiKey', 'Κλειδί API', false],
    ['publicKey', 'Δημόσιο κλειδί', false],
    ['secret', 'Μυστικό', true],
    ['webhookSecret', 'Μυστικό webhook', true],
  ],
  bunny: [
    ['storageZone', 'Ζώνη αποθήκευσης', false],
    ['cdnUrl', 'CDN URL', false],
    ['storageUrl', 'Storage URL', false],
    ['accessKey', 'Κλειδί πρόσβασης', true],
  ],
  openrouter: [
    ['model', 'Μοντέλο', false],
    ['apiKey', 'Κλειδί API', true],
  ],
  mailgun: [
    ['domain', 'Domain', false],
    ['from', 'Αποστολέας', false],
    ['region', 'Περιοχή (us/eu)', false],
    ['apiKey', 'Κλειδί API', true],
  ],
};

export function IntegrationSettings() {
  const [view, setView] = useState<Record<Svc, any> | null>(null);
  const [form, setForm] = useState<Record<string, string>>({}); // `${svc}.${field}` -> value
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState<Svc | null>(null);
  const [results, setResults] = useState<Partial<Record<Svc, TestResult>>>({});

  async function load() {
    const v = await fetch('/api/settings/integrations').then((r) => r.json());
    setView(v);
    // seed non-secret fields into the form; secrets stay blank
    const f: Record<string, string> = {};
    (Object.keys(FIELDS) as Svc[]).forEach((svc) =>
      FIELDS[svc].forEach(([key, , secret]) => {
        if (!secret) f[`${svc}.${key}`] = v[svc]?.[key] ?? '';
      }),
    );
    setForm(f);
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const payload: Record<string, Record<string, string>> = {};
      (Object.keys(FIELDS) as Svc[]).forEach((svc) => {
        const obj: Record<string, string> = {};
        FIELDS[svc].forEach(([key]) => {
          obj[key] = form[`${svc}.${key}`] ?? '';
        });
        payload[svc] = obj;
      });
      await fetch('/api/settings/integrations', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSaved(true);
      await load(); // refresh masks, clear typed secrets
      setForm((prev) => {
        const next = { ...prev };
        (Object.keys(FIELDS) as Svc[]).forEach((svc) =>
          FIELDS[svc].forEach(([key, , secret]) => secret && delete next[`${svc}.${key}`]),
        );
        return next;
      });
    } finally {
      setSaving(false);
    }
  }

  async function test(svc: Svc) {
    setTesting(svc);
    try {
      const res = await fetch('/api/settings/integrations/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ service: svc }),
      });
      const json = (await res.json()) as TestResult;
      setResults((p) => ({ ...p, [svc]: json }));
    } finally {
      setTesting(null);
    }
  }

  if (!view) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Φόρτωση…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {(Object.keys(META) as Svc[]).map((svc) => {
          const { title, Icon, color } = META[svc];
          const res = results[svc];
          const configured = view[svc]?.configured;
          return (
            <div key={svc} className="rounded-lg border border-border p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md p-1.5" style={{ backgroundColor: `${color}1A`, color }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${configured ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}
                >
                  {configured ? 'Ρυθμισμένο' : 'Μη ρυθμισμένο'}
                </span>
              </div>

              <div className="space-y-2">
                {FIELDS[svc].map(([key, label, secret]) => {
                  const id = `${svc}.${key}`;
                  const hint = secret ? view[svc]?.[key] : '';
                  return (
                    <div key={id} className="grid grid-cols-3 items-center gap-2">
                      <label htmlFor={id} className="text-sm text-muted-foreground col-span-1">{label}</label>
                      <input
                        id={id}
                        type={secret ? 'password' : 'text'}
                        value={form[id] ?? ''}
                        placeholder={secret ? (hint || 'not set') : ''}
                        onChange={(e) => setForm((p) => ({ ...p, [id]: e.target.value }))}
                        className="col-span-2 rounded border border-input bg-background px-2 py-1 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => test(svc)}
                  disabled={testing === svc}
                  className="text-sm px-3 py-1.5 rounded border border-border hover:bg-muted disabled:opacity-60"
                >
                  {testing === svc ? 'Έλεγχος…' : 'Έλεγχος σύνδεσης'}
                </button>
                {res && (
                  <span className={`flex items-center gap-1 text-sm ${res.ok ? 'text-emerald-600' : 'text-destructive'}`}>
                    {res.ok ? <FiCheckCircle className="h-4 w-4" /> : <FiXCircle className="h-4 w-4" />}
                    {res.detail} {res.status ? `(${res.status})` : ''}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
          Αποθήκευση
        </button>
        {saved && <span className="text-sm text-emerald-600">Αποθηκεύτηκε</span>}
        <span className="text-xs text-muted-foreground">Άφησε κενό ένα μυστικό για να κρατήσει την τρέχουσα τιμή. Οι τιμές υπερισχύουν του <code>.env.local</code>.</span>
      </div>
    </div>
  );
}
