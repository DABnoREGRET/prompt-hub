import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-8 text-center">
      <p className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--p-accent)]">
        404
      </p>
      <h1 className="mt-2 font-display text-2xl font-normal text-[var(--p-ink)]">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-[var(--p-muted)]">
        The route you requested does not exist in Prompt Hub.
      </p>
      <Link
        to="/"
        className="btn-tactile mt-5 inline-block rounded-md bg-[var(--p-accent)] px-4 py-2 text-sm font-medium text-[var(--p-accent-ink)]"
      >
        Back to Explore
      </Link>
    </div>
  );
}
