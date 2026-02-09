export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="text-center max-w-md space-y-4"
        style={{ color: 'var(--text-primary)' }}
      >
        <div className="text-4xl">✉️</div>
        <h1
          className="font-display text-2xl font-bold tracking-tight"
        >
          Check your email
        </h1>
        <p
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          We sent you a magic link. Click it to sign in and save your stance card to your collection.
        </p>
        <a
          href="/"
          className="inline-block text-xs font-mono uppercase tracking-wider mt-6 transition-colors"
          style={{
            color: 'var(--text-tertiary)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
          }}
        >
          Back to game
        </a>
      </div>
    </div>
  )
}
