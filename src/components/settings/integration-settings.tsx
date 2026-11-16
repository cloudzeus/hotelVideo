'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Video, HardDrive, Sparkles, Mail } from 'lucide-react';

type Svc = 'stream' | 'bunny' | 'openrouter' | 'mailgun';
type TestResult = { ok: boolean; status: number; detail: string };

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono truncate max-w-[60%] text-right">{value || '—'}</span>
    </div>
  );
}

export function IntegrationSettings() {
  const [status, setStatus] = useState<Record<Svc, any> | null>(null);
  const [testing, setTesting] = useState<Svc | null>(null);
  const [results, setResults] = useState<Partial<Record<Svc, TestResult>>>({});

  useEffect(() => {
    fetch('/api/settings/integrations')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

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
    } catch {
      setResults((p) => ({ ...p, [svc]: { ok: false, status: 0, detail: 'Request failed' } }));
    } finally {
      setTesting(null);
    }
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading integrations…
      </div>
    );
  }

  const section = (
    svc: Svc,
    title: string,
    Icon: typeof Video,
    configured: boolean,
    fields: [string, string | null | undefined][],
  ) => {
    const res = results[svc];
    return (
      <div key={svc} className="rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${configured ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}
          >
            {configured ? 'Configured' : 'Not configured'}
          </span>
        </div>
        <div className="divide-y divide-border/60">
          {fields.map(([l, v]) => (
            <Field key={l} label={l} value={v} />
          ))}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => test(svc)}
            disabled={testing === svc}
            className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground disabled:opacity-60"
          >
            {testing === svc ? 'Testing…' : 'Test connection'}
          </button>
          {res ? (
            <span className={`flex items-center gap-1 text-sm ${res.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {res.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {res.detail} {res.status ? `(${res.status})` : ''}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">Keys are edited in <code>.env.local</code> and loaded on restart.</p>
      </div>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {section('stream', 'Video Conference (Stream.io)', Video, status.stream.configured, [
        ['API key', status.stream.apiKey],
        ['Public key', status.stream.publicKey],
        ['Secret', status.stream.secret],
        ['Webhook secret', status.stream.webhookSecret],
      ])}
      {section('bunny', 'Bunny CDN', HardDrive, status.bunny.configured, [
        ['Storage zone', status.bunny.storageZone],
        ['CDN URL', status.bunny.cdnUrl],
        ['Storage URL', status.bunny.storageUrl],
        ['Access key', status.bunny.accessKey],
      ])}
      {section('openrouter', 'OpenRouter (AI)', Sparkles, status.openrouter.configured, [
        ['Model', status.openrouter.model],
        ['API key', status.openrouter.apiKey],
      ])}
      {section('mailgun', 'Mailgun (Email)', Mail, status.mailgun.configured, [
        ['Domain', status.mailgun.domain],
        ['From', status.mailgun.from],
        ['Region', status.mailgun.region],
        ['API key', status.mailgun.apiKey],
      ])}
    </div>
  );
}
