import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileCode2,
  Terminal,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { healthApi } from '../api/auth.api';
import { ApiClientError } from '../api/client';
import { fetchCategories, fetchPublicEntries } from '../api/entries.api';
import { EntryPreviewCard } from '../components/entries/EntryPreviewCard';
import { FilterBar } from '../components/entries/FilterBar';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/StatusState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { CategoryItem, EntrySortBy, EntrySummary, EntryType } from '../types/entry';

type ApiStatus = 'checking' | 'online' | 'offline';
type SpecimenTab = 'skill' | 'prompt' | 'snippet';

const PAGE_SIZE = 12;

const HERO_SPECIMENS: Record<
  SpecimenTab,
  { label: string; filename: string; content: string }
> = {
  skill: {
    label: 'SKILL.md Spec',
    filename: '.agents/skills/tdd-guard/SKILL.md',
    content: `---
name: tdd-guard
description: Write a failing regression test before changing code.
---

1. Add test case covering normal and boundary inputs.
2. Observe expected RED failure in Vitest.
3. Implement minimal fix and re-run full suite.`,
  },
  prompt: {
    label: 'Prompt Template',
    filename: 'prompts/code-review.md',
    content: `Review the {{language}} pull request for {{service_name}}.
Check boundary Zod schemas, SQL bindings, and missing tests.

Target focus: {{focus_area}}`,
  },
  snippet: {
    label: 'Code Utility',
    filename: 'server/src/middlewares/validate.ts',
    content: `export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    return next();
  };
}`,
  },
};

export function ExploreShellPage() {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') ?? '';
  const urlTypeRaw = searchParams.get('type') ?? '';
  const selectedType: EntryType | '' =
    urlTypeRaw === 'SNIPPET' || urlTypeRaw === 'PROMPT' || urlTypeRaw === 'SKILL'
      ? urlTypeRaw
      : '';
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

  const [specimenTab, setSpecimenTab] = useState<SpecimenTab>('skill');
  const [specimenCopied, setSpecimenCopied] = useState(false);

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

  const activeSpecimen = HERO_SPECIMENS[specimenTab];

  const handleCopySpecimen = async () => {
    try {
      await navigator.clipboard?.writeText(activeSpecimen.content);
      setSpecimenCopied(true);
      showToast(`Copied ${activeSpecimen.filename}`, 'success');
      window.setTimeout(() => setSpecimenCopied(false), 1800);
    } catch {
      // Clipboard unavailable in restricted contexts
    }
  };

  return (
    <div className="space-y-8">
      <section className="hero-enter bg-studio-ruled relative overflow-hidden rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1 font-mono text-xs text-[var(--p-ink)]">
                <Terminal className="h-3.5 w-3.5 text-[var(--p-accent)]" aria-hidden="true" />
                Developer Vault
              </span>
              <span
                role="status"
                aria-label="API connection status"
                className="inline-flex items-center gap-1.5 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1 font-mono text-xs text-[var(--p-ink)]"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    apiStatus === 'online'
                      ? 'bg-emerald-500'
                      : apiStatus === 'offline'
                        ? 'bg-amber-500'
                        : 'bg-[var(--p-muted)]'
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

            <h1 className="font-display text-3xl font-normal leading-tight tracking-tight text-[var(--p-ink)] sm:text-4xl lg:text-[42px]">
              Code snippets, AI prompts, and SKILL.md files for engineering teams
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-[var(--p-muted)]">
              Copy portable <code className="font-mono text-sm text-[var(--p-ink)]">SKILL.md</code>{' '}
              agent instructions, test parameterized{' '}
              <code className="font-mono text-sm text-[var(--p-ink)]">{'{{variable}}'}</code>{' '}
              prompts in-browser, and browse curated harness plugins.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isAuthenticated && user ? (
                <Link
                  to="/vault"
                  className="btn-tactile inline-flex h-11 items-center gap-2 rounded-md bg-[var(--p-accent)] px-5 text-sm font-medium text-[var(--p-accent-ink)]"
                >
                  Open My Vault
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="btn-tactile inline-flex h-11 items-center gap-2 rounded-md bg-[var(--p-accent)] px-5 text-sm font-medium text-[var(--p-accent-ink)]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}

              <Link
                to="/skills"
                className="btn-tactile inline-flex h-11 items-center gap-2 rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-4 text-sm font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
              >
                <FileCode2 className="h-4 w-4" aria-hidden="true" />
                Browse Curated Skills
              </Link>
            </div>

            <dl className="grid grid-cols-3 gap-4 border-t border-[var(--p-hairline)] pt-5 text-xs">
              <div>
                <dt className="text-[var(--p-muted)]">Entry Formats</dt>
                <dd className="mt-1 font-mono text-sm font-medium text-[var(--p-ink)]">
                  3 Types
                </dd>
              </div>
              <div>
                <dt className="text-[var(--p-muted)]">Curated Plugins</dt>
                <dd className="mt-1 font-mono text-sm font-medium text-[var(--p-ink)]">
                  MCP &amp; Skills
                </dd>
              </div>
              <div>
                <dt className="text-[var(--p-muted)]">Public Templates</dt>
                <dd className="mt-1 font-mono text-sm font-medium text-[var(--p-ink)]">
                  {totalEntries > 0 ? `${totalEntries} Live` : 'Ready'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-md border border-[var(--p-hairline)] bg-[var(--p-code-bg)] text-[var(--p-code-ink)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
                <div role="tablist" aria-label="Vault format specimens" className="flex items-center gap-1">
                  {(['skill', 'prompt', 'snippet'] as const).map((tabKey) => {
                    const active = specimenTab === tabKey;
                    return (
                      <button
                        key={tabKey}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSpecimenTab(tabKey)}
                        className={`rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                          active
                            ? 'bg-[var(--p-accent)] font-medium text-[var(--p-accent-ink)]'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {HERO_SPECIMENS[tabKey].label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleCopySpecimen}
                  className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 font-mono text-xs text-white/85 hover:border-white/40 hover:text-white"
                >
                  {specimenCopied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" aria-hidden="true" />
                      Copy file
                    </>
                  )}
                </button>
              </div>

              <div className="border-b border-white/10 px-4 py-1.5 font-mono text-xs text-white/55">
                {activeSpecimen.filename}
              </div>

              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-[var(--p-code-ink)]">
                <code>{activeSpecimen.content}</code>
              </pre>
            </div>
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
          <h2 className="font-display text-xl font-medium text-[var(--p-ink)]">
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
                  className="btn-tactile rounded-md bg-[var(--p-accent)] px-4 py-2 text-sm font-medium text-[var(--p-accent-ink)]"
                >
                  Reset Filters
                </button>
              }
            />
          ) : (
            <EmptyState
              title="No public entries yet"
              description="Seed the database or sign in to create the first snippet, prompt, or SKILL.md entry."
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
                className="flex items-center justify-between border-t border-[var(--p-hairline)] pt-4"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: page - 1 <= 1 ? null : String(page - 1) })}
                  className="btn-tactile inline-flex items-center gap-1 rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] px-3.5 py-2 text-sm font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </button>

                <span className="font-mono text-xs text-[var(--p-muted)]">
                  Page <strong className="font-medium text-[var(--p-ink)]">{page}</strong> of{' '}
                  <strong className="font-medium text-[var(--p-ink)]">{totalPages}</strong>
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  className="btn-tactile inline-flex items-center gap-1 rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] px-3.5 py-2 text-sm font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)] disabled:cursor-not-allowed disabled:opacity-45"
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
