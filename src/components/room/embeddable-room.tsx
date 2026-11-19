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
};

type Phase = 'prejoin' | 'joining' | 'incall' | 'error';

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

  // Stream's own theming ("template system"): override the SDK CSS variables so
  // the video tiles, controls and participant bar match the hotel accent and the
  // cinematic dark palette instead of Stream's default blue/grey.
  const streamVars: Record<string, string> = {
    '--str-video__primary-color': primary,
    '--str-video__button-primary-base': primary,
    '--str-video__button-primary-hover': primary,
    '--str-video__button-primary-active': primary,
    '--str-video__background-color1': '#15161d',
    '--str-video__background-color2': '#1e1f29',
    '--str-video__background-color4': '#0a0b12',
    '--str-video__base-color1': '#e8e8ee',
    '--str-video__text-color1': '#ffffff',
    '--str-video__border-radius-md': '14px',
    '--str-video__border-radius-lg': '18px',
  };

  return (
    <div
      className="str-video"
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        background: `radial-gradient(900px 420px at 50% -8%, ${primary}22, transparent 65%), linear-gradient(180deg, #0b0c13 0%, #07080d 100%)`,
        ...streamVars,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          background: 'rgba(17,22,36,.72)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {theme.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.logo} alt={theme.hotelName} style={{ height: 28 }} />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', background: primary, fontWeight: 700, fontSize: 13 }}>
            {theme.hotelName.charAt(0)}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '38vw' }}>
            {theme.hotelName}
          </span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>Concierge</span>
        </div>
        <div
          style={{
            marginLeft: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 99,
            background: 'rgba(43,191,106,.12)',
            border: '1px solid rgba(43,191,106,.3)',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 99, background: '#2bbf6a', boxShadow: '0 0 0 3px rgba(43,191,106,.2)' }} />
          <span>Σε σύνδεση</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.85 }} title="Συμμετέχοντες">
            <Users size={15} /> {participants.length}
          </span>
          <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.85, minWidth: 48, textAlign: 'right' }}>
            {formatDuration(seconds)}
          </span>
        </div>
      </header>

      <main style={{ flex: 1, minHeight: 0, padding: 16 }}>
        <div
          style={{
            height: '100%',
            borderRadius: 18,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,.07)',
            background: '#0a0b12',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04), 0 24px 60px rgba(0,0,0,.5)',
          }}
        >
          <SpeakerLayout participantsBarPosition="bottom" />
        </div>
      </main>

      <footer style={{ display: 'flex', justifyContent: 'center', paddingBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 14px',
            borderRadius: 18,
            background: 'rgba(14,15,22,.92)',
            border: '1px solid rgba(255,255,255,.08)',
            boxShadow: `0 10px 34px rgba(0,0,0,.5), 0 0 0 1px ${primary}14`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <CallControls onLeave={onLeave} />
        </div>
      </footer>
    </div>
  );
}

export function EmbeddableRoom({ slug, theme }: { slug: string; theme: RoomTheme }) {
  const [phase, setPhase] = useState<Phase>('prejoin');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [operatorOnline, setOperatorOnline] = useState<boolean | null>(null);
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const cleanup = useRef<() => void>(() => {});

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

  const leave = useCallback(() => {
    cleanup.current();
    cleanup.current = () => {};
    setCall(null);
    setClient(null);
    setPhase('prejoin');
  }, []);

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
    <div
      style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 16, background: '#0b0b0f', color: '#fff' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#15151c',
          border: '1px solid #26262e',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.4)',
        }}
      >
        {theme.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.logo} alt={theme.hotelName} style={{ height: 40, marginBottom: 12 }} />
        ) : null}
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{theme.hotelName} — Concierge</h1>
        <p style={{ margin: '6px 0 16px', opacity: 0.7, fontSize: 14 }}>
          Connect by video with our concierge team.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: operatorOnline ? '#2bbf6a' : operatorOnline === false ? '#8a8a93' : '#c9a227',
              boxShadow: operatorOnline ? '0 0 0 3px rgba(43,191,106,.2)' : 'none',
            }}
          />
          <span style={{ opacity: 0.85 }}>
            {operatorOnline == null ? 'Checking availability…' : operatorOnline ? 'A concierge is online' : 'No concierge online — leave a request'}
          </span>
        </div>

        <label style={{ fontSize: 13, opacity: 0.85 }}>Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && join()}
          placeholder="e.g. Maria P."
          style={{
            width: '100%',
            marginTop: 6,
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 4,
            border: '1px solid #33333d',
            background: '#0f0f15',
            color: '#fff',
            fontSize: 16,
          }}
        />

        {error ? <p style={{ color: '#ff6b6b', fontSize: 13, marginTop: 0 }}>{error}</p> : null}

        <button
          onClick={join}
          disabled={!name.trim() || phase === 'joining'}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 4,
            border: 'none',
            background: primary,
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: name.trim() && phase !== 'joining' ? 'pointer' : 'not-allowed',
            opacity: name.trim() && phase !== 'joining' ? 1 : 0.6,
          }}
        >
          {phase === 'joining' ? 'Connecting…' : 'Join video call'}
        </button>
      </div>
    </div>
  );
}
