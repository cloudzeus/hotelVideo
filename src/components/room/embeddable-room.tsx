'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  SpeakerLayout,
  CallControls,
  type Call,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

export type RoomTheme = {
  primary: string; // hex, taken from the hotel site
  hotelName: string;
  logo?: string;
  companyId?: string;
};

type Phase = 'prejoin' | 'joining' | 'incall' | 'error';

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
      <div style={{ height: '100dvh', background: '#0b0b0f' }}>
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <div className="str-video" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <SpeakerLayout participantsBarPosition="bottom" />
              </div>
              <CallControls onLeave={leave} />
            </div>
          </StreamCall>
        </StreamVideo>
      </div>
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
