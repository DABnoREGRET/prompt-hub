import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { healthApi } from '../api/auth.api';
import { ApiClientError } from '../api/client';
import { fetchCategories, fetchPublicEntries } from '../api/entries.api';
import { EntryPreviewCard } from '../components/entries/EntryPreviewCard';
import { FilterBar } from '../components/entries/FilterBar';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/StatusState';
import { useAuth } from '../context/AuthContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { CategoryItem, EntrySortBy, EntrySummary, EntryType } from '../types/entry';

type ApiStatus = 'checking' | 'online' | 'offline';
const PAGE_SIZE = 12;

export function ExploreShellPage() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlTypeRaw = searchParams.get('type') ?? '';
  const selectedType: EntryType | '' =
    urlTypeRaw === 'SNIPPET' || urlTypeRaw === 'PROMPT' ? urlTypeRaw : '';
  const selectedCategory = searchParams.get('category') ?? '';
  const selectedLanguage = searchParams.get('language') ?? '';
  const selectedTag = searchParams.get('tag') ?? '';
  const sortRaw = searchParams.get('sortBy') ?? 'newest';
  const sortBy: EntrySortBy =
    sortRaw === 'popular' || sortRaw === 'title' ? sortRaw : 'newest';
  const parsedPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const [searchInput, setSearchInput] = useState(urlQ);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Keep health probe first so smoke/integration tests see /health immediately on mount.
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

    fetchCategories()
      .then((res) => {
        if (!cancelled) {
          setCategories(res.categories);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSearchInput(urlQ);
  }, [urlQ]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, val] of Object.entries(updates)) {
            if (val === null || val === '') {
              next.delete(key);
            } else {
              next.set(key, val);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    const trimmedInput = searchInput.trim();
    const trimmedDebounced = debouncedSearch.trim();
    const trimmedUrl = urlQ.trim();
    if (trimmedDebounced === trimmedInput && trimmedDebounced !== trimmedUrl) {
      updateParams({ q: trimmedDebounced || null, page: null });
    }
  }, [searchInput, debouncedSearch, urlQ, updateParams]);

  const loadEntries = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(null);

    try {
      const entriesRes = await fetchPublicEntries({
        q: urlQ || undefined,
        type: selectedType || undefined,
        category: selectedCategory || undefined,
        language: selectedLanguage || undefined,
        tag: selectedTag || undefined,
        sortBy,
        page,
        pageSize: PAGE_SIZE,
      });
      setEntries(entriesRes.data);
      setTotalEntries(entriesRes.pagination.total);
      setTotalPages(entriesRes.pagination.totalPages);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setCatalogError(err.message);
      } else {
        setCatalogError('Unable to load community snippets and prompts.');
      }
    } finally {
      setLoadingCatalog(false);
    }
  }, [urlQ, selectedType, selectedCategory, selectedLanguage, selectedTag, sortBy, page]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        urlQ ||
          searchInput.trim() ||
          selectedType ||
          selectedCategory ||
          selectedLanguage ||
          selectedTag ||
          sortBy !== 'newest',
      ),
    [
      urlQ,
      searchInput,
      selectedType,
      selectedCategory,
      selectedLanguage,
      selectedTag,
      sortBy,
    ],
  );

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const handleBookmarkChange = (
    entryId: number,
    bookmarked: boolean,
    bookmarkCount: number,
  ) => {
    setEntries((prev) =>
      prev.map((item) =>
        item.id === entryId
          ? { ...item, isBookmarked: bookmarked, bookmarkCount }
          : item,
      ),
    );
  };

  return (
    <div className="space-y-6">
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

      <FilterBar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        selectedType={selectedType}
        onTypeChange={(type) => updateParams({ type: type || null, page: null })}
        selectedCategory={selectedCategory}
        onCategoryChange={(slug) => updateParams({ category: slug || null, page: null })}
        selectedLanguage={selectedLanguage}
        onLanguageChange={(lang) => updateParams({ language: lang || null, page: null })}
        selectedTag={selectedTag}
        onClearTag={() => updateParams({ tag: null, page: null })}
        sortBy={sortBy}
        onSortChange={(nextSort) =>
          updateParams({
            sortBy: nextSort === 'newest' ? null : nextSort,
            page: null,
          })
        }
        categories={categories}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Community Catalog {totalEntries > 0 ? `(${totalEntries})` : ''}
          </h2>
        </div>

        {loadingCatalog ? (
          <LoadingSkeleton count={6} />
        ) : catalogError ? (
          <ErrorState message={catalogError} onRetry={() => void loadEntries()} />
        ) : entries.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              title="No snippets or prompts match your filters"
              description="Try clearing a keyword, language, or category filter to see more community templates."
              action={
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Reset Filters
                </button>
              }
            />
          ) : (
            <EmptyState
              title="No public entries yet"
              description="Seed the database or sign in to create the first snippet or prompt."
            />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <EntryPreviewCard
                  key={entry.id}
                  entry={entry}
                  onTagClick={(tag) =>
                    updateParams({ tag: selectedTag === tag ? null : tag, page: null })
                  }
                  onBookmarkChange={handleBookmarkChange}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav
                aria-label="Catalog pagination"
                className="flex items-center justify-between border-t border-slate-200 pt-4"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: page - 1 <= 1 ? null : String(page - 1) })}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </button>

                <span className="text-sm text-slate-600">
                  Page <strong className="font-medium text-slate-900">{page}</strong> of{' '}
                  <strong className="font-medium text-slate-900">{totalPages}</strong>
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

export { ExploreShellPage as ExplorePage };
