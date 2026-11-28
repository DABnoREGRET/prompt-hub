import { ExternalLink, Plus, Shield, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '../api/client';
import {
  createCuratedSkillApi,
  deleteCuratedSkillApi,
  fetchCuratedSkills,
  updateCuratedSkillApi,
} from '../api/curatedSkills.api';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/StatusState';
import { useToast } from '../context/ToastContext';
import type { CuratedSkillItem } from '../types/curatedSkill';

export function AdminCuratedSkillsPage() {
  const { showToast } = useToast();

  const [skills, setSkills] = useState<CuratedSkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [harness, setHarness] = useState('Claude Code');
  const [category, setCategory] = useState('Workflow');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [installCommand, setInstallCommand] = useState('');
  const [skillMdContent, setSkillMdContent] = useState('');
  const [tagsText, setTagsText] = useState('skill-md, ai-harness');
  const [isFeatured, setIsFeatured] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCuratedSkills();
      setSkills(res.skills);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to load curated skills catalog.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (title.trim().length < 2) {
      setFormError('Skill Title must be at least 2 characters.');
      return;
    }
    if (!/^https?:\/\//i.test(repoUrl.trim())) {
      setFormError('Repository URL must start with http:// or https://.');
      return;
    }
    if (skillMdContent.trim().length < 10) {
      setFormError('SKILL.md Content must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await createCuratedSkillApi({
        title: title.trim(),
        harness: harness.trim(),
        category: category.trim(),
        description: description.trim(),
        repoUrl: repoUrl.trim(),
        docsUrl: docsUrl.trim(),
        installCommand: installCommand.trim(),
        skillMdContent: skillMdContent.trim(),
        tags,
        isFeatured,
      });

      setSkills((prev) => [res.skill, ...prev]);
      setTitle('');
      setDescription('');
      setRepoUrl('');
      setDocsUrl('');
      setInstallCommand('');
      setSkillMdContent('');
      showToast(`Added "${res.skill.title}" to curated skills`, 'success');
    } catch (err) {
      setFormError(
        err instanceof ApiClientError ? err.message : 'Unable to add curated skill.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (item: CuratedSkillItem) => {
    try {
      const res = await updateCuratedSkillApi(item.id, {
        isFeatured: !item.isFeatured,
      });
      setSkills((prev) =>
        prev.map((row) => (row.id === item.id ? res.skill : row)),
      );
      showToast(
        res.skill.isFeatured ? 'Marked as featured' : 'Removed featured badge',
        'info',
      );
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : 'Unable to update skill.',
        'error',
      );
    }
  };

  const handleDelete = async (item: CuratedSkillItem) => {
    try {
      await deleteCuratedSkillApi(item.id);
      setSkills((prev) => prev.filter((row) => row.id !== item.id));
      showToast(`Deleted "${item.title}"`, 'info');
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : 'Unable to delete curated skill.',
        'error',
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded border border-[var(--p-hairline)] bg-[var(--p-surface)] px-2.5 py-0.5 font-mono text-xs text-[var(--p-accent)]">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Admin Console
          </span>
          <h1 className="mt-2 font-display text-2xl font-normal text-[var(--p-ink)] sm:text-3xl">
            Curated Harness Skills &amp; Plugins
          </h1>
          <p className="mt-1 text-sm text-[var(--p-muted)]">
            Publish official skill repositories, MCP plugins, and verified{' '}
            <code className="font-mono text-xs text-[var(--p-ink)]">SKILL.md</code>{' '}
            starters with external links.
          </p>
        </div>
        <Link
          to="/skills"
          className="btn-tactile rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] px-4 py-2 text-sm font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
        >
          View Public Directory
        </Link>
      </div>

      <section className="rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-6">
        <h2 className="font-display text-lg font-medium text-[var(--p-ink)]">
          Add Popular Skill / Plugin Entry
        </h2>

        {formError ? (
          <div
            role="alert"
            className="mt-4 rounded border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-500 dark:text-rose-300"
          >
            {formError}
          </div>
        ) : null}

        <form onSubmit={handleCreate} noValidate className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="curated-title"
                className="mb-1 block text-xs font-medium text-[var(--p-muted)]"
              >
                Skill Title
              </label>
              <input
                id="curated-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Superpowers Dev Workflow"
                className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="curated-harness"
                className="mb-1 block text-xs font-medium text-[var(--p-muted)]"
              >
                Target Harness
              </label>
              <input
                id="curated-harness"
                type="text"
                value={harness}
                onChange={(e) => setHarness(e.target.value)}
                placeholder="Claude Code / Cursor / MCP"
                className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="curated-category"
                className="mb-1 block text-xs font-medium text-[var(--p-muted)]"
              >
                Category
              </label>
              <input
                id="curated-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Software Workflow / MCP Plugin"
                className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="curated-repo-url"
                className="mb-1 block text-xs font-medium text-[var(--p-muted)]"
              >
                Repository URL
              </label>
              <input
                id="curated-repo-url"
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/org/skills"
                className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="curated-docs-url"
                className="mb-1 block text-xs font-medium text-[var(--p-muted)]"
              >
                Docs URL (optional)
              </label>
              <input
                id="curated-docs-url"
                type="url"
                value={docsUrl}
                onChange={(e) => setDocsUrl(e.target.value)}
                placeholder="https://agentskills.io"
                className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="curated-install"
                className="mb-1 block text-xs font-medium text-[var(--p-muted)]"
              >
                Install Command (optional)
              </label>
              <input
                id="curated-install"
                type="text"
                value={installCommand}
                onChange={(e) => setInstallCommand(e.target.value)}
                placeholder="npx skills add org/repo"
                className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 font-mono text-xs text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="curated-tags"
                className="mb-1 block text-xs font-medium text-[var(--p-muted)]"
              >
                Tags (comma separated)
              </label>
              <input
                id="curated-tags"
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="curated-description"
              className="mb-1 block text-xs font-medium text-[var(--p-muted)]"
            >
              Summary Description
            </label>
            <input
              id="curated-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Concise summary of what the plugin or skill does..."
              className="h-10 w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] focus:border-[var(--p-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="curated-skill-md"
              className="mb-1 block text-xs font-medium text-[var(--p-muted)]"
            >
              SKILL.md Content (ready to copy-paste)
            </label>
            <textarea
              id="curated-skill-md"
              rows={5}
              value={skillMdContent}
              onChange={(e) => setSkillMdContent(e.target.value)}
              placeholder="---&#10;name: my-skill&#10;description: Trigger rules...&#10;---"
              className="w-full rounded-md border border-[var(--p-hairline)] bg-[var(--p-code-bg)] p-3 font-mono text-xs text-[var(--p-code-ink)] focus:border-[var(--p-accent)] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--p-ink)]">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 accent-[var(--p-accent)]"
              />
              Feature on top of Curated Skills directory
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="btn-tactile inline-flex h-10 items-center gap-1.5 rounded-md bg-[var(--p-accent)] px-4 text-sm font-medium text-[var(--p-accent-ink)] disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {submitting ? 'Saving...' : 'Add Curated Skill'}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-medium text-[var(--p-ink)]">
          Published Curated Registry ({skills.length})
        </h2>

        {loading ? (
          <LoadingSkeleton count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void loadSkills()} />
        ) : skills.length === 0 ? (
          <EmptyState
            title="No curated skills published yet"
            description="Use the form above to add popular agent skill repositories and MCP plugins."
          />
        ) : (
          <div className="space-y-3">
            {skills.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-4 rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-4 sm:flex-row sm:items-center"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-medium text-[var(--p-ink)]">
                      {item.title}
                    </span>
                    <span className="rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2 py-0.5 font-mono text-xs text-[var(--p-accent)]">
                      {item.harness}
                    </span>
                    {item.isFeatured ? (
                      <span className="rounded border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-xs text-amber-700 dark:text-amber-300">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--p-muted)]">{item.description}</p>
                  <a
                    href={item.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-[var(--p-ink)] hover:underline"
                  >
                    {item.repoUrl}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleFeatured(item)}
                    className="btn-tactile inline-flex items-center gap-1 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 py-1.5 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
                  >
                    <Star className="h-3.5 w-3.5" aria-hidden="true" />
                    {item.isFeatured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${item.title}`}
                    onClick={() => void handleDelete(item)}
                    className="btn-tactile inline-flex items-center gap-1 rounded border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/20 dark:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
