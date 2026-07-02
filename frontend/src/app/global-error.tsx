'use client';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui', background: '#fffbf5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🌟</div>
        <h1 style={{ fontSize: '1.5rem', color: '#FF6B9D', marginBottom: '0.5rem' }}>Something went wrong</h1>
        <p style={{ color: '#9ca3af', marginBottom: '1.5rem', maxWidth: '24rem' }}>
          LittleLearners hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          style={{ padding: '0.75rem 2rem', backgroundColor: '#FF6B9D', color: 'white', border: 'none', borderRadius: '1rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
          Try Again
        </button>
      </body>
    </html>
  );
}
