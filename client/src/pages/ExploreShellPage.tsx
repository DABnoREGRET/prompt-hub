import { Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { healthApi } from '../api/auth.api';
import { ApiClientError } from '../api/client';
import { fetchCategories, fetchPublicEntries } from '../api/entries.api';
import { EntryPreviewCard } from '../components/entries/EntryPreviewCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/StatusState';
import { useAuth } from '../context/AuthContext';
import type { CategoryItem, EntrySummary } from '../types/entry';

type ApiStatus = 'checking' | 'online' | 'offline';

export function ExploreShellPage() {
  const { isAuthenticated, user } = useAuth();
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(null);

    try {
      const [catsRes, entriesRes] = await Promise.all([
        fetchCategories().catch(() => ({ categories: [] as CategoryItem[] })),
        fetchPublicEntries(1, 12),
      ]);
      setCategories(catsRes.categories);
      setEntries(entriesRes.data);
      setTotalEntries(entriesRes.pagination.total);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setCatalogError(err.message);
      } else {
        setCatalogError('Unable to load community snippets and prompts.');
      }
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    healthApi()
      .then((res) => {
        if (!cancelled) {
          setApiStatus(res.status === 'ok' ? 'online' : 'offline');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApiStatus('offline');
        }
      });

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [loadCatalog]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Snippet &amp; Prompt Workspace
              </span>
              <span
                role="status"
                aria-label="API connection status"
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  apiStatus === 'online'
                    ? 'bg-emerald-50 text-emerald-700'
                    : apiStatus === 'offline'
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    apiStatus === 'online'
                      ? 'bg-emerald-500'
                      : apiStatus === 'offline'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                  aria-hidden="true"
                />
                {apiStatus === 'online'
                  ? 'API Connected'
                  : apiStatus === 'offline'
                    ? 'API Offline / Waking up'
                    : 'Connecting to API...'}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Explore Reusable Code Snippets &amp; AI Prompts
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Browse community templates, filter by language or category, and run interactive{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
                {'{{variable}}'}
              </code>{' '}
              prompts directly in your browser.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {isAuthenticated && user ? (
              <Link
                to="/vault"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Open My Vault
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section aria-label="Categories" className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
            >
              {cat.name} ({cat.entryCount})
            </span>
          ))}
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Community Catalog {totalEntries > 0 ? `(${totalEntries})` : ''}
          </h2>
        </div>

        {loadingCatalog ? (
          <LoadingSkeleton count={6} />
        ) : catalogError ? (
          <ErrorState message={catalogError} onRetry={() => void loadCatalog()} />
        ) : entries.length === 0 ? (
          <EmptyState
            title="No public entries yet"
            description="Seed the database or sign in to create the first snippet or prompt."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <EntryPreviewCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
