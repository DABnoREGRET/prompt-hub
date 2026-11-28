import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FileCode2,
  Search,
  Star,
  Terminal,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '../api/client';
import { fetchCuratedSkills } from '../api/curatedSkills.api';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/StatusState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { CuratedSkillItem } from '../types/curatedSkill';

export function CuratedSkillsPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [skills, setSkills] = useState<CuratedSkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHarness, setSelectedHarness] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSkillId, setExpandedSkillId] = useState<number | null>(null);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCuratedSkills();
      setSkills(res.skills);
      if (res.skills.length > 0 && expandedSkillId === null) {
        setExpandedSkillId(res.skills[0].id);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to load curated harness skills.',
      );
    } finally {
      setLoading(false);
    }
  }, [expandedSkillId]);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const harnessOptions = useMemo(() => {
    return Array.from(new Set(skills.map((s) => s.harness))).sort();
  }, [skills]);

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return skills.filter((item) => {
      if (selectedHarness && item.harness !== selectedHarness) {
        return false;
      }
      if (!q) return true;
      return `${item.title} ${item.description} ${item.harness} ${item.category} ${item.tags.join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [skills, searchQuery, selectedHarness]);

  const copyText = async (key: string, value: string, message: string) => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopiedId(key);
      showToast(message, 'success');
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      showToast('Clipboard unavailable in this browser context', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <section className="hero-enter bg-studio-ruled rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1 font-mono text-xs text-[var(--p-accent)]">
              <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
              AI Harness Directory
            </span>
            <h1 className="font-display text-2xl font-normal tracking-tight text-[var(--p-ink)] sm:text-3xl">
              Curated Skills &amp; Plugins for AI Coding Harnesses
            </h1>
            <p className="text-sm leading-relaxed text-[var(--p-muted)] sm:text-base">
              Verified repositories, CLI install commands, and ready-to-paste{' '}
              <code className="font-mono text-xs text-[var(--p-ink)]">SKILL.md</code>{' '}
              blueprints for Claude Code, Cursor, Codex, and MCP harnesses.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {isAdmin ? (
              <Link
                to="/admin"
                className="btn-tactile rounded-md bg-[var(--p-accent)] px-4 py-2 text-sm font-medium text-[var(--p-accent-ink)]"
              >
                Manage Curated List
              </Link>
            ) : null}
            <Link
              to="/"
              className="btn-tactile rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-4 py-2 text-sm font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
            >
              Community Vault
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--p-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Filter curated skills"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search skills, plugins, or harnesses..."
              className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] py-2 pl-9 pr-3 text-sm text-[var(--p-ink)] placeholder:text-[var(--p-muted)] focus:border-[var(--p-accent)] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2" aria-label="Filter by harness">
            <button
              type="button"
              aria-pressed={selectedHarness === ''}
              onClick={() => setSelectedHarness('')}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedHarness === ''
                  ? 'border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-ink)]'
                  : 'border-[var(--p-hairline)] bg-[var(--p-bg)] text-[var(--p-ink)] hover:border-[var(--p-accent)]'
              }`}
            >
              All Harnesses
            </button>
            {harnessOptions.map((harness) => {
              const active = selectedHarness === harness;
              return (
                <button
                  key={harness}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedHarness(active ? '' : harness)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-ink)]'
                      : 'border-[var(--p-hairline)] bg-[var(--p-bg)] text-[var(--p-ink)] hover:border-[var(--p-accent)]'
                  }`}
                >
                  {harness}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadSkills()} />
      ) : filteredSkills.length === 0 ? (
        <EmptyState
          title="No curated skills match your filter"
          description="Clear the search keyword or switch harness filters to inspect the full curated registry."
          action={
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedHarness('');
              }}
              className="rounded-md bg-[var(--p-accent)] px-4 py-2 text-sm font-medium text-[var(--p-accent-ink)]"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredSkills.map((skill) => {
            const isExpanded = expandedSkillId === skill.id;
            const installKey = `install-${skill.id}`;
            const skillKey = `skill-${skill.id}`;

            return (
              <article
                key={skill.id}
                className="card-interactive flex flex-col justify-between rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-5"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-0.5 font-mono text-xs font-medium text-[var(--p-accent)]">
                        {skill.harness}
                      </span>
                      <span className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-0.5 font-mono text-xs text-[var(--p-muted)]">
                        {skill.category}
                      </span>
                      {skill.isFeatured ? (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-medium text-amber-800 dark:text-amber-300">
                          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                          Featured
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <h2 className="font-display text-xl font-medium text-[var(--p-ink)]">
                      {skill.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--p-muted)]">
                      {skill.description}
                    </p>
                  </div>

                  {skill.installCommand ? (
                    <div className="flex items-center justify-between gap-2 rounded border border-[var(--p-hairline)] bg-[var(--p-code-bg)] px-3 py-2 text-[var(--p-code-ink)]">
                      <code className="flex items-center gap-2 truncate font-mono text-xs">
                        <Terminal className="h-3.5 w-3.5 shrink-0 text-[var(--p-accent)]" aria-hidden="true" />
                        {skill.installCommand}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          void copyText(
                            installKey,
                            skill.installCommand,
                            `Copied install command for ${skill.title}`,
                          )
                        }
                        aria-label={`Copy install command for ${skill.title}`}
                        className="shrink-0 rounded border border-white/15 px-2 py-1 font-mono text-xs text-white/85 hover:border-white/40 hover:text-white"
                      >
                        {copiedId === installKey ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Copied
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Copy className="h-3 w-3" aria-hidden="true" />
                            Install
                          </span>
                        )}
                      </button>
                    </div>
                  ) : null}

                  <div className="space-y-2 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSkillId(isExpanded ? null : skill.id)
                        }
                        className="font-mono text-xs font-medium text-[var(--p-ink)] hover:underline"
                      >
                        {isExpanded ? 'Hide SKILL.md starter' : 'Preview SKILL.md starter'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void copyText(
                            skillKey,
                            skill.skillMdContent,
                            `Copied SKILL.md for ${skill.title}`,
                          )
                        }
                        aria-label={`Copy SKILL.md for ${skill.title}`}
                        className="inline-flex items-center gap-1 rounded border border-[var(--p-hairline)] bg-[var(--p-surface)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
                      >
                        {copiedId === skillKey ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                            Copied SKILL.md
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            Copy SKILL.md
                          </>
                        )}
                      </button>
                    </div>

                    {isExpanded ? (
                      <pre className="max-h-48 overflow-x-auto rounded border border-[var(--p-hairline)] bg-[var(--p-code-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--p-code-ink)]">
                        <code>{skill.skillMdContent}</code>
                      </pre>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--p-hairline)] pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2 py-0.5 font-mono text-xs text-[var(--p-muted)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={skill.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-tactile inline-flex items-center gap-1 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
                    >
                      Repository
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                    {skill.docsUrl ? (
                      <a
                        href={skill.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-tactile inline-flex items-center gap-1 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
                      >
                        <BookOpen className="h-3 w-3" aria-hidden="true" />
                        Docs
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
