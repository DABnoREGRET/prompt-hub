import {
  ArrowLeft,
  Bookmark,
  Check,
  Copy,
  Download,
  Edit3,
  FileCode2,
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
import { AiAssistantPanel } from '../components/entries/AiAssistantPanel';
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
      showToast(
        entry.entryType === 'SKILL'
          ? 'Copied SKILL.md to clipboard'
          : 'Copied content to clipboard',
        'success',
      );
      window.setTimeout(() => setCopiedRaw(false), 1800);
    } catch {
      showToast('Clipboard access unavailable in this browser context', 'error');
    }
  };

  const handleDownloadSkillMd = () => {
    if (!entry) return;
    try {
      const blob = new Blob([entry.content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'SKILL.md';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      showToast('Downloaded SKILL.md', 'success');
    } catch {
      showToast('Unable to trigger file download', 'error');
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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--p-muted)] hover:text-[var(--p-ink)]"
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
          description="The requested snippet, prompt, or SKILL.md file does not exist or has been removed."
          action={
            <Link
              to="/"
              className="rounded-md bg-[var(--p-accent)] px-4 py-2 text-sm font-medium text-[var(--p-accent-ink)]"
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
          <header className="rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 font-mono text-xs font-medium ${
                      entry.entryType === 'PROMPT'
                        ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : entry.entryType === 'SKILL'
                          ? 'border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                          : 'border border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300'
                    }`}
                  >
                    {entry.entryType === 'PROMPT' ? (
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : entry.entryType === 'SKILL' ? (
                      <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {entry.entryType}
                  </span>
                  <span className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-0.5 font-mono text-xs text-[var(--p-muted)]">
                    {entry.language}
                  </span>
                  {entry.visibility === 'PRIVATE' ? (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-800 dark:text-amber-300">
                      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                      PRIVATE
                    </span>
                  ) : null}
                  {entry.categoryName && entry.categorySlug ? (
                    <Link
                      to={`/?category=${encodeURIComponent(entry.categorySlug)}`}
                      className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
                    >
                      {entry.categoryName}
                    </Link>
                  ) : null}
                </div>

                <h1 className="font-display text-2xl font-normal tracking-tight text-[var(--p-ink)] sm:text-3xl">
                  {entry.title}
                </h1>
                {entry.description ? (
                  <p className="max-w-3xl text-sm leading-relaxed text-[var(--p-muted)]">
                    {entry.description}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--p-muted)]">
                  <span>
                    Authored by{' '}
                    <strong className="font-medium text-[var(--p-ink)]">
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
                        className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-0.5 font-mono text-xs text-[var(--p-muted)] hover:border-[var(--p-accent)] hover:text-[var(--p-ink)]"
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
                  className="btn-tactile inline-flex items-center gap-1.5 rounded-md bg-[var(--p-accent)] px-3.5 py-2 text-sm font-medium text-[var(--p-accent-ink)]"
                >
                  {copiedRaw ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      {entry.entryType === 'SKILL' ? 'Copy SKILL.md' : 'Copy Content'}
                    </>
                  )}
                </button>

                {entry.entryType === 'SKILL' ? (
                  <button
                    type="button"
                    onClick={handleDownloadSkillMd}
                    className="btn-tactile inline-flex items-center gap-1.5 rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 py-2 text-sm font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download SKILL.md
                  </button>
                ) : null}

                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleBookmarkToggle}
                    disabled={bookmarkBusy}
                    aria-pressed={Boolean(entry.isBookmarked)}
                    className={`btn-tactile inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      entry.isBookmarked
                        ? 'border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-ink)]'
                        : 'border-[var(--p-hairline)] bg-[var(--p-bg)] text-[var(--p-ink)] hover:border-[var(--p-accent)]'
                    }`}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${entry.isBookmarked ? 'fill-current' : ''}`}
                      aria-hidden="true"
                    />
                    {entry.bookmarkCount}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 py-2 font-mono text-sm text-[var(--p-muted)]">
                    <Bookmark className="h-4 w-4" aria-hidden="true" />
                    {entry.bookmarkCount}
                  </span>
                )}

                {canModify ? (
                  <>
                    <Link
                      to={`/entries/${entry.id}/edit`}
                      className="btn-tactile inline-flex items-center gap-1.5 rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 py-2 text-sm font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOpen(true)}
                      className="btn-tactile inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/20 dark:text-rose-300"
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

          <section className="rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-5">
            <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-wide text-[var(--p-muted)]">
              {entry.entryType === 'SKILL'
                ? 'SKILL.md Portable Definition (YAML + Workflow)'
                : entry.entryType === 'PROMPT'
                  ? 'Raw Prompt Template'
                  : 'Source Code'}
            </h2>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-[var(--p-hairline)] bg-[var(--p-code-bg)] p-4 font-mono text-xs leading-relaxed text-[var(--p-code-ink)] sm:text-sm">
              <code>{entry.content}</code>
            </pre>
          </section>

          {isAuthenticated ? (
            <AiAssistantPanel
              entryType={entry.entryType}
              language={entry.language}
              title={entry.title}
              content={entry.content}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] px-5 py-4 text-sm text-[var(--p-muted)]">
              <span>
                Sign in to use the AI Vault Assistant (Explain, Improve, Suggest Tags).
              </span>
              <Link
                to="/login"
                className="btn-tactile rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 py-1.5 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
              >
                Sign in
              </Link>
            </div>
          )}
        </article>
      ) : null}

      {confirmDeleteOpen && entry ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-entry-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-md rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-6 shadow-xl">
            <h2
              id="delete-entry-dialog-title"
              className="font-display text-lg font-medium text-[var(--p-ink)]"
            >
              Delete Entry
            </h2>
            <p className="mt-2 text-sm text-[var(--p-muted)]">
              Are you sure you want to permanently delete{' '}
              <strong className="font-medium text-[var(--p-ink)]">{entry.title}</strong>?
              This removes associated bookmarks and tag links.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3.5 py-2 text-sm font-medium text-[var(--p-ink)]"
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
