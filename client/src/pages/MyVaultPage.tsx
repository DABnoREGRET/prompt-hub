import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '../api/client';
import { fetchMyEntries } from '../api/entries.api';
import { EntryPreviewCard } from '../components/entries/EntryPreviewCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/StatusState';
import type { EntrySummary } from '../types/entry';

export function MyVaultPage() {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <EntryPreviewCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
