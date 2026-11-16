'use client';

// Minimal, self-contained global error boundary. The framework default pulls in
// React context that can be null during static prerender (the Docker build failed
// prerendering /_global-error); this one uses no hooks/context so it always renders.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="el">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0, background: '#fafaf9', color: '#1c1917' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px' }}>Κάτι πήγε στραβά</h1>
          <p style={{ color: '#78716c', margin: '0 0 20px' }}>Προέκυψε απρόσμενο σφάλμα. Δοκίμασε ξανά.</p>
          <button
            onClick={() => reset()}
            style={{ background: '#0078D4', color: '#fff', border: 0, borderRadius: 6, padding: '10px 18px', fontSize: 15, cursor: 'pointer' }}
          >
            Δοκίμασε ξανά
          </button>
        </div>
      </body>
    </html>
  );
}
