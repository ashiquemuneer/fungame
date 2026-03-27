import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="panel mx-auto max-w-xl p-10 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--accent-text)]">
        404
      </p>
      <h2 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">Page not found</h2>
      <p className="mt-4 text-[var(--text-primary)]/70">
        That route is not part of the quiz flow yet.
      </p>
      <Link className="button-primary mt-6" to="/">
        Back to overview
      </Link>
    </div>
  )
}
