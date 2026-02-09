export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="text-center max-w-md space-y-4"
        style={{ color: 'var(--text-primary)' }}
      >
        <div className="text-4xl">⚠️</div>
        <h1
          className="font-display text-2xl font-bold tracking-tight"
        >
          Something went wrong
        </h1>
        <p
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          We couldn&apos;t sign you in. The link may have expired — try again.
        </p>
        <a
          href="/"
          className="inline-block text-xs font-mono uppercase tracking-wider mt-6 transition-colors"
          style={{
            color: 'var(--accent)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
