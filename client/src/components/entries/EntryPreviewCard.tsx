import { Bookmark, Check, Copy, Lock, Sparkles, Terminal } from 'lucide-react';
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
    () => (entry.entryType === 'PROMPT' ? countTemplateVariables(entry.content) : 0),
    [entry.entryType, entry.content],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(entry.content);
      setCopied(true);
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

  return (
    <article className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                entry.entryType === 'PROMPT'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-sky-50 text-sky-700'
              }`}
            >
              {entry.entryType === 'PROMPT' ? (
                <Sparkles className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Terminal className="h-3 w-3" aria-hidden="true" />
              )}
              {entry.entryType}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
              {entry.language}
            </span>
            {entry.visibility === 'PRIVATE' ? (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                <Lock className="h-3 w-3" aria-hidden="true" />
                PRIVATE
              </span>
            ) : null}
            {variableCount > 0 ? (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {variableCount} {variableCount === 1 ? 'var' : 'vars'}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${entry.title}`}
            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy
              </>
            )}
          </button>
        </div>

        <h3 className="mt-3 text-base font-semibold text-slate-900">
          <Link
            to={`/entries/${entry.id}`}
            className="hover:text-emerald-700 hover:underline focus:outline-none focus:underline"
          >
            {entry.title}
          </Link>
        </h3>
        {entry.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{entry.description}</p>
        ) : null}

        <pre className="mt-3 max-h-28 overflow-hidden rounded-md border border-slate-200 bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
          <code>{entry.content}</code>
        </pre>
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        {entry.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.slice(0, 4).map((tag) =>
              onTagClick ? (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  #{tag}
                </button>
              ) : (
                <span
                  key={tag}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                >
                  #{tag}
                </span>
              ),
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            by <strong className="font-medium text-slate-700">@{entry.authorUsername}</strong>
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
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                  bookmarked
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Bookmark
                  className={`h-3.5 w-3.5 ${bookmarked ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
                {bookmarkCount}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-600">
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
