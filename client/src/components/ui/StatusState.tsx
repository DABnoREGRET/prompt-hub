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
          className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full rounded bg-slate-100" />
          <div className="mt-2 h-3 w-4/5 rounded bg-slate-100" />
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
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
    >
      <Inbox className="h-10 w-10 text-slate-400" aria-hidden="true" />
      <h2 className="mt-3 text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
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
      className="flex flex-col items-start justify-between gap-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900 sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Something went wrong</p>
          <p className="text-sm text-rose-800">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      ) : null}
    </div>
  );
}
