import { AlertCircle, Inbox, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="h-44 animate-pulse rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-5"
        >
          <div className="h-4 w-2/3 rounded bg-[var(--p-elevated)]" />
          <div className="mt-3 h-3 w-full rounded bg-[var(--p-elevated)] opacity-75" />
          <div className="mt-2 h-3 w-4/5 rounded bg-[var(--p-elevated)] opacity-75" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-md border border-dashed border-[var(--p-hairline)] bg-[var(--p-surface)] px-6 py-12 text-center"
    >
      <Inbox className="h-10 w-10 text-[var(--p-muted)]" aria-hidden="true" />
      <h2 className="mt-3 font-display text-lg font-medium text-[var(--p-ink)]">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-[var(--p-muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start justify-between gap-4 rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-[var(--p-ink)] sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">Something went wrong</p>
          <p className="text-sm text-[var(--p-muted)]">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="btn-tactile inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-[var(--p-bg)] px-3 py-1.5 text-sm font-medium text-[var(--p-ink)] hover:border-rose-400"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
