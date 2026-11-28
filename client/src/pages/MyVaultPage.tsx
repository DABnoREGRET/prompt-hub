import { Edit3, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '../api/client';
import { deleteEntryApi, fetchMyEntries } from '../api/entries.api';
import { EntryPreviewCard } from '../components/entries/EntryPreviewCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/StatusState';
import { useToast } from '../context/ToastContext';
import type { EntrySummary } from '../types/entry';

type VaultFilter = 'ALL' | 'PUBLIC' | 'PRIVATE' | 'SNIPPET' | 'PROMPT';

export function MyVaultPage() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<VaultFilter>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<EntrySummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMine = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyEntries();
      setEntries(res.data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Unable to load your personal vault.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  const counts = useMemo(
    () => ({
      ALL: entries.length,
      PUBLIC: entries.filter((e) => e.visibility === 'PUBLIC').length,
      PRIVATE: entries.filter((e) => e.visibility === 'PRIVATE').length,
      SNIPPET: entries.filter((e) => e.entryType === 'SNIPPET').length,
      PROMPT: entries.filter((e) => e.entryType === 'PROMPT').length,
    }),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    switch (activeFilter) {
      case 'PUBLIC':
        return entries.filter((e) => e.visibility === 'PUBLIC');
      case 'PRIVATE':
        return entries.filter((e) => e.visibility === 'PRIVATE');
      case 'SNIPPET':
        return entries.filter((e) => e.entryType === 'SNIPPET');
      case 'PROMPT':
        return entries.filter((e) => e.entryType === 'PROMPT');
      default:
        return entries;
    }
  }, [entries, activeFilter]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteEntryApi(deleteTarget.id);
      setEntries((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      showToast(`Deleted "${deleteTarget.title}"`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : 'Unable to delete entry.',
        'error',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Vault</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your public and private code snippets and AI prompt templates.
          </p>
        </div>
        <Link
          to="/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          New Entry
        </Link>
      </div>

      {entries.length > 0 ? (
        <div
          role="group"
          aria-label="Filter personal vault entries"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              { key: 'ALL', label: `All (${counts.ALL})` },
              { key: 'PUBLIC', label: `Public (${counts.PUBLIC})` },
              { key: 'PRIVATE', label: `Private (${counts.PRIVATE})` },
              { key: 'SNIPPET', label: `Snippets (${counts.SNIPPET})` },
              { key: 'PROMPT', label: `Prompts (${counts.PROMPT})` },
            ] as const
          ).map((tab) => {
            const active = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveFilter(tab.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadMine()} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Your vault is empty"
          description="Save reusable snippets or private prompts here to keep them organized."
          action={
            <Link
              to="/new"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Create First Entry
            </Link>
          }
        />
      ) : filteredEntries.length === 0 ? (
        <EmptyState
          title="No matching entries in this view"
          description="Switch filter tabs above or create a new snippet or prompt."
          action={
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Show All Entries
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => (
            <EntryPreviewCard
              key={entry.id}
              entry={entry}
              actions={
                <div className="flex items-center gap-1">
                  <Link
                    to={`/entries/${entry.id}/edit`}
                    aria-label={`Edit ${entry.title}`}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Edit3 className="h-3 w-3" aria-hidden="true" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete ${entry.title}`}
                    onClick={() => setDeleteTarget(entry)}
                    className="inline-flex items-center gap-1 rounded border border-rose-200 px-1.5 py-0.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {deleteTarget ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2
              id="vault-delete-dialog-title"
              className="text-lg font-semibold text-slate-900"
            >
              Delete Entry
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Permanently delete{' '}
              <strong className="font-medium text-slate-900">
                {deleteTarget.title}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-md bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
