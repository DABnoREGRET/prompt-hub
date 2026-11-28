import {
  ArrowLeft,
  Bookmark,
  Check,
  Copy,
  Edit3,
  Lock,
  Sparkles,
  Terminal,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiClientError } from '../api/client';
import {
  addBookmarkApi,
  deleteEntryApi,
  fetchEntryById,
  removeBookmarkApi,
} from '../api/entries.api';
import { PromptPlayground } from '../components/entries/PromptPlayground';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/StatusState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { EntrySummary } from '../types/entry';

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [entry, setEntry] = useState<EntrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const numericId = Number(id);

  const loadDetail = useCallback(async () => {
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setLoading(false);
      setError({ status: 404, message: 'Invalid entry ID' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchEntryById(numericId);
      setEntry(res.entry);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError({ status: err.status, message: err.message });
      } else {
        setError({ message: 'Unable to load entry details.' });
      }
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const canModify = Boolean(
    user && entry && (user.id === entry.authorId || user.role === 'ADMIN'),
  );

  const handleCopyRaw = async () => {
    if (!entry) return;
    try {
      await navigator.clipboard?.writeText(entry.content);
      setCopiedRaw(true);
      showToast('Copied content to clipboard', 'success');
      window.setTimeout(() => setCopiedRaw(false), 1800);
    } catch {
      showToast('Clipboard access unavailable in this browser context', 'error');
    }
  };

  const handleBookmarkToggle = async () => {
    if (!entry || !isAuthenticated || bookmarkBusy) return;
    const nextBookmarked = !entry.isBookmarked;
    const prevState = entry;
    setEntry({
      ...entry,
      isBookmarked: nextBookmarked,
      bookmarkCount: Math.max(0, entry.bookmarkCount + (nextBookmarked ? 1 : -1)),
    });
    setBookmarkBusy(true);

    try {
      const res = nextBookmarked
        ? await addBookmarkApi(entry.id)
        : await removeBookmarkApi(entry.id);
      setEntry((curr) =>
        curr
          ? {
              ...curr,
              isBookmarked: res.bookmarked,
              bookmarkCount: res.bookmarkCount,
            }
          : curr,
      );
    } catch {
      setEntry(prevState);
      showToast('Unable to update bookmark.', 'error');
    } finally {
      setBookmarkBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!entry || deleting) return;
    setDeleting(true);
    try {
      await deleteEntryApi(entry.id);
      showToast('Entry deleted permanently', 'info');
      navigate('/vault', { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Unable to delete entry.';
      showToast(message, 'error');
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Explore
        </Link>
      </div>

      {loading ? (
        <LoadingSkeleton count={2} />
      ) : error?.status === 404 ? (
        <EmptyState
          title="Entry not found"
          description="The requested snippet or prompt does not exist or has been removed."
          action={
            <Link
              to="/"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Back to Explore
            </Link>
          }
        />
      ) : error ? (
        <ErrorState
          message={error.message}
          onRetry={error.status === 403 ? undefined : () => void loadDetail()}
        />
      ) : entry ? (
        <article className="space-y-6">
          <header className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-xs font-semibold ${
                      entry.entryType === 'PROMPT'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    {entry.entryType === 'PROMPT' ? (
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {entry.entryType}
                  </span>
                  <span className="rounded bg-slate-100 px-2.5 py-0.5 font-mono text-xs text-slate-700">
                    {entry.language}
                  </span>
                  {entry.visibility === 'PRIVATE' ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      PRIVATE
                    </span>
                  ) : null}
                  {entry.categoryName && entry.categorySlug ? (
                    <Link
                      to={`/?category=${encodeURIComponent(entry.categorySlug)}`}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                    >
                      {entry.categoryName}
                    </Link>
                  ) : null}
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {entry.title}
                </h1>
                {entry.description ? (
                  <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
                    {entry.description}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                  <span>
                    Authored by{' '}
                    <strong className="font-medium text-slate-800">
                      @{entry.authorUsername}
                    </strong>
                  </span>
                  <span>
                    Updated{' '}
                    {new Date(entry.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {entry.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {entry.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/?tag=${encodeURIComponent(tag)}`}
                        className="rounded bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {copiedRaw ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      Copy Content
                    </>
                  )}
                </button>

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleBookmarkToggle}
                    disabled={bookmarkBusy}
                    aria-pressed={Boolean(entry.isBookmarked)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      entry.isBookmarked
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${entry.isBookmarked ? 'fill-current' : ''}`}
                      aria-hidden="true"
                    />
                    {entry.bookmarkCount}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                    <Bookmark className="h-4 w-4" aria-hidden="true" />
                    {entry.bookmarkCount}
                  </span>
                )}

                {canModify ? (
                  <>
                    <Link
                      to={`/entries/${entry.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </header>

          {entry.entryType === 'PROMPT' ? (
            <PromptPlayground content={entry.content} />
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              {entry.entryType === 'PROMPT' ? 'Raw Prompt Template' : 'Source Code'}
            </h2>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-900 p-4 font-mono text-xs leading-relaxed text-slate-100 sm:text-sm">
              <code>{entry.content}</code>
            </pre>
          </section>
        </article>
      ) : null}

      {confirmDeleteOpen && entry ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-entry-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2
              id="delete-entry-dialog-title"
              className="text-lg font-semibold text-slate-900"
            >
              Delete Entry
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to permanently delete{' '}
              <strong className="font-medium text-slate-900">{entry.title}</strong>?
              This removes associated bookmarks and tag links.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDeleteOpen(false)}
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
