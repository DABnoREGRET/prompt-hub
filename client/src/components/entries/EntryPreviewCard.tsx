import {
  Bookmark,
  Check,
  Copy,
  FileCode2,
  Lock,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { addBookmarkApi, removeBookmarkApi } from '../../api/entries.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { EntrySummary } from '../../types/entry';

function countTemplateVariables(content: string): number {
  const matches = content.match(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g);
  if (!matches) return 0;
  return new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '').trim())).size;
}

interface EntryPreviewCardProps {
  entry: EntrySummary;
  onTagClick?: (tag: string) => void;
  onBookmarkChange?: (
    entryId: number,
    bookmarked: boolean,
    bookmarkCount: number,
  ) => void;
  actions?: ReactNode;
}

export function EntryPreviewCard({
  entry,
  onTagClick,
  onBookmarkChange,
  actions,
}: EntryPreviewCardProps) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(Boolean(entry.isBookmarked));
  const [bookmarkCount, setBookmarkCount] = useState(entry.bookmarkCount);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  useEffect(() => {
    setBookmarked(Boolean(entry.isBookmarked));
    setBookmarkCount(entry.bookmarkCount);
  }, [entry.id, entry.isBookmarked, entry.bookmarkCount]);

  const variableCount = useMemo(
    () => (entry.entryType !== 'SNIPPET' ? countTemplateVariables(entry.content) : 0),
    [entry.entryType, entry.content],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(entry.content);
      setCopied(true);
      showToast(
        entry.entryType === 'SKILL'
          ? `Copied ${entry.title} SKILL.md`
          : `Copied ${entry.title}`,
        'success',
      );
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  };

  const handleToggleBookmark = async () => {
    if (!isAuthenticated || bookmarkBusy) return;

    const prevBookmarked = bookmarked;
    const prevCount = bookmarkCount;
    const nextBookmarked = !prevBookmarked;
    const optimisticCount = Math.max(0, prevCount + (nextBookmarked ? 1 : -1));

    setBookmarked(nextBookmarked);
    setBookmarkCount(optimisticCount);
    setBookmarkBusy(true);

    try {
      const res = nextBookmarked
        ? await addBookmarkApi(entry.id)
        : await removeBookmarkApi(entry.id);
      setBookmarked(res.bookmarked);
      setBookmarkCount(res.bookmarkCount);
      onBookmarkChange?.(entry.id, res.bookmarked, res.bookmarkCount);
    } catch {
      setBookmarked(prevBookmarked);
      setBookmarkCount(prevCount);
      showToast('Unable to update bookmark right now.', 'error');
    } finally {
      setBookmarkBusy(false);
    }
  };

  const badgeClass =
    entry.entryType === 'PROMPT'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
      : entry.entryType === 'SKILL'
        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
        : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30';

  return (
    <article className="card-interactive flex flex-col justify-between rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-xs font-medium ${badgeClass}`}
            >
              {entry.entryType === 'PROMPT' ? (
                <Sparkles className="h-3 w-3" aria-hidden="true" />
              ) : entry.entryType === 'SKILL' ? (
                <FileCode2 className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Terminal className="h-3 w-3" aria-hidden="true" />
              )}
              {entry.entryType}
            </span>
            <span className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2 py-0.5 font-mono text-xs text-[var(--p-muted)]">
              {entry.language}
            </span>
            {entry.visibility === 'PRIVATE' ? (
              <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-medium text-amber-800 dark:text-amber-300">
                <Lock className="h-3 w-3" aria-hidden="true" />
                PRIVATE
              </span>
            ) : null}
            {variableCount > 0 ? (
              <span className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2 py-0.5 font-mono text-xs text-[var(--p-ink)]">
                {variableCount} {variableCount === 1 ? 'var' : 'vars'}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${entry.title}`}
            className="btn-tactile inline-flex items-center gap-1 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {entry.entryType === 'SKILL' ? 'Copy SKILL.md' : 'Copy'}
              </>
            )}
          </button>
        </div>

        <h3 className="mt-3.5 font-display text-lg font-medium leading-snug text-[var(--p-ink)]">
          <Link
            to={`/entries/${entry.id}`}
            className="hover:text-[var(--p-accent)] hover:underline focus:outline-none focus:underline"
          >
            {entry.title}
          </Link>
        </h3>
        {entry.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--p-muted)]">
            {entry.description}
          </p>
        ) : null}

        <pre className="mt-3 max-h-28 overflow-hidden rounded border border-[var(--p-hairline)] bg-[var(--p-code-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--p-code-ink)]">
          <code>{entry.content}</code>
        </pre>
      </div>

      <div className="mt-4 space-y-2.5 border-t border-[var(--p-hairline)] pt-3">
        {entry.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.slice(0, 4).map((tag) =>
              onTagClick ? (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2 py-0.5 font-mono text-xs text-[var(--p-muted)] hover:border-[var(--p-accent)] hover:text-[var(--p-ink)]"
                >
                  #{tag}
                </button>
              ) : (
                <span
                  key={tag}
                  className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2 py-0.5 font-mono text-xs text-[var(--p-muted)]"
                >
                  #{tag}
                </span>
              ),
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 text-xs text-[var(--p-muted)]">
          <span>
            by{' '}
            <strong className="font-medium text-[var(--p-ink)]">
              @{entry.authorUsername}
            </strong>
            {entry.categoryName ? ` · ${entry.categoryName}` : ''}
          </span>

          <div className="flex items-center gap-2">
            {actions}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleToggleBookmark}
                disabled={bookmarkBusy}
                aria-pressed={bookmarked}
                aria-label={
                  bookmarked
                    ? `Remove bookmark for ${entry.title}`
                    : `Bookmark ${entry.title}`
                }
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs font-medium transition-colors ${
                  bookmarked
                    ? 'border border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-ink)]'
                    : 'border border-[var(--p-hairline)] bg-[var(--p-bg)] text-[var(--p-ink)] hover:border-[var(--p-accent)]'
                }`}
              >
                <Bookmark
                  className={`h-3.5 w-3.5 ${bookmarked ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
                {bookmarkCount}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono text-[var(--p-muted)]">
                <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                {bookmarkCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
