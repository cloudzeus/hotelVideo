'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { EmbeddableRoom } from '@/components/room/embeddable-room';

type OpenOpts = { hotelName?: string; companyId?: string; name?: string };
type Ctx = { openCall: (slug: string, opts?: OpenOpts) => void };

const CallCtx = createContext<Ctx | null>(null);

// Always mounted via the provider, so the hook is safe to call anywhere under it.
export function useCallModal(): Ctx {
  const ctx = useContext(CallCtx);
  if (!ctx) throw new Error('useCallModal must be used within CallModalProvider');
  return ctx;
}

type State = { slug: string; hotelName: string; companyId?: string; name?: string };

/** Hosts the video room as a full-screen modal over the dashboard, so joining a
 *  call never navigates away — closing the modal returns to the dashboard. */
export function CallModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const openCall = useCallback(
    (slug: string, opts?: OpenOpts) =>
      setState({ slug, hotelName: opts?.hotelName ?? 'Concierge', companyId: opts?.companyId, name: opts?.name ?? 'Concierge' }),
    [],
  );
  const close = useCallback(() => setState(null), []);

  return (
    <CallCtx.Provider value={{ openCall }}>
      {children}
      {state ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="relative h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
            <button
              type="button"
              onClick={close}
              aria-label="Κλείσιμο"
              className="absolute right-3 top-3 z-[130] grid h-9 w-9 place-items-center rounded-lg border bg-background/90 text-foreground shadow-sm hover:bg-muted"
            >
              <X size={18} />
            </button>
            <EmbeddableRoom
              slug={state.slug}
              theme={{ primary: '#2563EB', hotelName: state.hotelName, companyId: state.companyId }}
              defaultName={state.name}
              onExit={close}
            />
          </div>
        </div>
      ) : null}
    </CallCtx.Provider>
  );
}
