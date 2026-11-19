'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  SpeakerLayout,
  CallControls,
  useCallStateHooks,
  type Call,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Users } from 'lucide-react';

export type RoomTheme = {
  primary: string; // hex, taken from the hotel site
  hotelName: string;
  logo?: string;
  companyId?: string;
  siteUrl?: string; // hotel website, offered as the way back after a call
};

type Phase = 'prejoin' | 'joining' | 'incall' | 'ended' | 'error';

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Branded in-call shell: top bar (brand + live status + participants + timer),
 *  framed video stage, floating control dock. Rendered inside StreamCall so the
 *  Stream state hooks work. */
function InCallChrome({ theme, onLeave }: { theme: RoomTheme; onLeave: () => void }) {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const primary = theme.primary || '#2563EB';

  // Match the rest of the app: theme Stream's own CSS variables onto the DG light
  // design tokens so the tiles, controls and participant bar look like the app,
  // not Stream's default dark blue/grey.
  const streamVars: Record<string, string> = {
    '--str-video__primary-color': 'hsl(var(--primary))',
    '--str-video__button-primary-base': 'hsl(var(--primary))',
    '--str-video__button-primary-hover': 'hsl(var(--primary))',
    '--str-video__button-primary-active': 'hsl(var(--primary))',
    '--str-video__background-color1': 'hsl(var(--card))',
    '--str-video__background-color2': 'hsl(var(--muted))',
    '--str-video__background-color4': 'hsl(var(--secondary))',
    '--str-video__base-color1': 'hsl(var(--foreground))',
    '--str-video__text-color1': 'hsl(var(--foreground))',
    '--str-video__border-radius-md': '12px',
    '--str-video__border-radius-lg': '16px',
  };

  return (
    <div className="str-video flex h-full flex-col bg-background text-foreground" style={streamVars}>
      <header className="flex items-center gap-3 border-b bg-card px-4 py-2.5">
        {theme.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.logo} alt={theme.hotelName} className="h-7" />
        ) : (
          <div className="grid h-7 w-7 place-items-center rounded-md text-[13px] font-bold text-white" style={{ background: primary }}>
            {theme.hotelName.charAt(0)}
          </div>
        )}
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">{theme.hotelName}</span>
          <span className="text-[11px] text-muted-foreground">Concierge</span>
        </div>
        <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Σε σύνδεση
        </span>
        <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5" title="Συμμετέχοντες">
            <Users size={15} /> {participants.length}
          </span>
          <span className="tabular-nums">{formatDuration(seconds)}</span>
        </div>
      </header>

      <main className="min-h-0 flex-1 p-4">
        <div className="h-full overflow-hidden rounded-xl border bg-muted">
          <SpeakerLayout participantsBarPosition="bottom" />
        </div>
      </main>

      <footer className="flex justify-center pb-5">
        <div className="rounded-full border bg-card px-3 py-2 shadow-lg">
          <CallControls onLeave={onLeave} />
        </div>
      </footer>
    </div>
  );
}

export function EmbeddableRoom({ slug, theme, onExit, defaultName }: { slug: string; theme: RoomTheme; onExit?: () => void; defaultName?: string }) {
  const [phase, setPhase] = useState<Phase>('prejoin');
  const [name, setName] = useState(defaultName ?? '');
  const [error, setError] = useState('');
  const [operatorOnline, setOperatorOnline] = useState<boolean | null>(null);
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const cleanup = useRef<() => void>(() => {});
  const autoJoined = useRef(false);

  // operator presence badge
  useEffect(() => {
    const url = `/api/public/operator-status${theme.companyId ? `?companyId=${encodeURIComponent(theme.companyId)}` : ''}`;
    const tick = () =>
      fetch(url)
        .then((r) => r.json())
        .then((d) => setOperatorOnline(!!d.online))
        .catch(() => setOperatorOnline(null));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [theme.companyId]);

  useEffect(() => () => cleanup.current(), []);

  const join = useCallback(async () => {
    setPhase('joining');
    setError('');
    try {
      const res = await fetch('/api/public/room-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, name }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? 'Could not get a room token');
      const { apiKey, token, userId, userName } = await res.json();

      const c = new StreamVideoClient({ apiKey, user: { id: userId, name: userName || 'Guest' }, token });
      const theCall = c.call('default', slug);

      // Probe camera/mic permission first. If the guest has no device or blocks
      // it, disable both so join() never calls getUserMedia (which otherwise
      // throws "Permission was not granted") — they join muted and can enable
      // later from the call controls.
      try {
        const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        probe.getTracks().forEach((t) => t.stop());
      } catch {
        await theCall.camera.disable().catch(() => {});
        await theCall.microphone.disable().catch(() => {});
      }

      await theCall.join({ create: true });

      cleanup.current = () => {
        theCall.leave().catch(() => {});
        c.disconnectUser().catch(() => {});
      };
      setClient(c);
      setCall(theCall);
      setPhase('incall');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join');
      setPhase('error');
    }
  }, [slug, name]);

  // Staff open the call in a modal with their name already supplied → skip the
  // pre-join card and connect straight away.
  useEffect(() => {
    if (defaultName && !autoJoined.current) {
      autoJoined.current = true;
      join();
    }
  }, [defaultName, join]);

  const leave = useCallback(() => {
    cleanup.current();
    cleanup.current = () => {};
    setCall(null);
    setClient(null);
    // In a modal (staff), close it and return to the dashboard; embedded on the
    // website, fall back to the end screen so the guest can rejoin.
    if (onExit) onExit();
    else setPhase('ended');
  }, [onExit]);

  if (phase === 'incall' && client && call) {
    return (
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <InCallChrome theme={theme} onLeave={leave} />
        </StreamCall>
      </StreamVideo>
    );
  }

  // pre-join / joining / error — themed to the hotel
  const primary = theme.primary || '#0078D4';
  return (
    <div className="grid h-full place-items-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        {theme.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.logo} alt={theme.hotelName} className="mb-3 h-10" />
        ) : null}
        {phase === 'ended' ? (
          <>
            <h1 className="text-xl font-semibold">Η κλήση ολοκληρώθηκε</h1>
            <p className="mb-4 mt-1.5 text-sm text-muted-foreground">Ευχαριστούμε που μιλήσατε με {theme.hotelName}.</p>
            {/* Inside the website's own modal the guest is already on the site: no link back. */}
            {theme.siteUrl && window.self === window.top ? (
              <a
                href={theme.siteUrl}
                target="_top"
                className="block rounded-md px-4 py-3 text-center text-sm font-semibold text-white"
                style={{ background: primary }}
              >
                Επιστροφή στην ιστοσελίδα {theme.hotelName}
              </a>
            ) : null}
            <button
              onClick={() => setPhase('prejoin')}
              className="mt-3 w-full rounded-md border bg-transparent px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              Επανασύνδεση
            </button>
          </>
        ) : (
          <>
        <h1 className="text-xl font-semibold">{theme.hotelName} — Concierge</h1>
        <p className="mb-4 mt-1.5 text-sm text-muted-foreground">
          Συνδεθείτε με βίντεο με την ομάδα concierge.
        </p>

        <div className="mb-4 flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: operatorOnline ? '#2bbf6a' : operatorOnline === false ? '#9ca3af' : '#c9a227' }}
          />
          <span className="text-muted-foreground">
            {operatorOnline == null ? 'Έλεγχος διαθεσιμότητας…' : operatorOnline ? 'Ένας concierge είναι online' : 'Κανένας concierge online αυτή τη στιγμή'}
          </span>
        </div>

        <label className="text-sm text-muted-foreground" htmlFor="room-name">Το όνομά σας</label>
        <input
          id="room-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && join()}
          placeholder="π.χ. Μαρία Π."
          className="mb-4 mt-1.5 w-full rounded-md border bg-background px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
        />

        {error ? <p className="mt-0 text-sm text-destructive">{error}</p> : null}

        <button
          onClick={join}
          disabled={!name.trim() || phase === 'joining'}
          className="w-full rounded-md px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: primary }}
        >
          {phase === 'joining' ? 'Σύνδεση…' : 'Είσοδος στην κλήση'}
        </button>
          </>
        )}
      </div>
    </div>
  );
}
