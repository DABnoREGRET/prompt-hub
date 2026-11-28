import { ArrowLeft, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiClientError } from '../api/client';
import {
  createEntryApi,
  fetchCategories,
  fetchEntryById,
  updateEntryApi,
} from '../api/entries.api';
import { AiAssistantPanel } from '../components/entries/AiAssistantPanel';
import { extractPromptVariables } from '../components/entries/PromptPlayground';
import { ErrorState, LoadingSkeleton } from '../components/ui/StatusState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { CategoryItem, EntryType, EntryVisibility } from '../types/entry';
import { entryFormSchema, normalizeTagSlug } from '../validation/entry.schema';

const FORM_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'sql',
  'bash',
  'dockerfile',
  'yaml',
  'markdown',
  'json',
  'plaintext',
] as const;

export function EntryFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const entryId = id ? Number(id) : null;

  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingPage, setLoadingPage] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('SNIPPET');
  const [language, setLanguage] = useState('typescript');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<EntryVisibility>('PUBLIC');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
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
    if (!isEdit) {
      setLoadingPage(false);
      return;
    }
    if (!entryId || !Number.isInteger(entryId) || entryId <= 0) {
      setLoadingPage(false);
      setLoadError('Invalid entry ID');
      return;
    }

    let cancelled = false;
    setLoadingPage(true);
    setLoadError(null);

    fetchEntryById(entryId)
      .then((res) => {
        if (cancelled) return;
        const found = res.entry;
        if (user && found.authorId !== user.id && user.role !== 'ADMIN') {
          setLoadError('403 — You do not have permission to edit this entry.');
          return;
        }
        setTitle(found.title);
        setEntryType(found.entryType);
        setLanguage(found.language);
        setCategoryId(found.categoryId);
        setVisibility(found.visibility);
        setDescription(found.description);
        setContent(found.content);
        setTags(found.tags);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiClientError
            ? err.message
            : 'Unable to load entry for editing.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPage(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, entryId, user]);

  const detectedVars = useMemo(
    () => (entryType === 'PROMPT' ? extractPromptVariables(content) : []),
    [entryType, content],
  );

  const handleAddTag = () => {
    const slug = normalizeTagSlug(tagDraft);
    if (!slug) {
      setTagDraft('');
      return;
    }
    if (tags.includes(slug)) {
      setTagDraft('');
      return;
    }
    if (tags.length >= 8) {
      setFieldErrors((prev) => ({
        ...prev,
        tags: 'Cannot attach more than 8 tags',
      }));
      return;
    }
    setTags((prev) => [...prev, slug]);
    setTagDraft('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.tags;
      return next;
    });
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (target: string) => {
    setTags((prev) => prev.filter((item) => item !== target));
  };

  const handleApplyAiTags = (suggested: string[]) => {
    setTags((prev) => {
      const merged = Array.from(
        new Set([...prev, ...suggested.map(normalizeTagSlug).filter(Boolean)]),
      ).slice(0, 8);
      return merged;
    });
    showToast('Applied suggested tags', 'info');
  };

  const handleApplyAiContent = (improvedContent: string) => {
    setContent(improvedContent);
    showToast('Applied AI content suggestion', 'success');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);

    const pendingSlug = normalizeTagSlug(tagDraft);
    const mergedTags =
      pendingSlug && !tags.includes(pendingSlug) && tags.length < 8
        ? [...tags, pendingSlug]
        : tags;

    const parsed = entryFormSchema.safeParse({
      title,
      entryType,
      language,
      categoryId,
      visibility,
      description,
      content,
      tags: mergedTags,
    });

    if (!parsed.success) {
      const errs = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        title: errs.title?.[0] ?? '',
        language: errs.language?.[0] ?? '',
        description: errs.description?.[0] ?? '',
        content: errs.content?.[0] ?? '',
        tags: errs.tags?.[0] ?? '',
      });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const res =
        isEdit && entryId
          ? await updateEntryApi(entryId, parsed.data)
          : await createEntryApi(parsed.data);
      showToast(
        isEdit ? 'Entry updated successfully' : 'Entry created successfully',
        'success',
      );
      navigate(`/entries/${res.entry.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Unable to save entry right now.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPage) {
    return <LoadingSkeleton count={2} />;
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          to="/vault"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to My Vault
        </Link>
        <ErrorState message={loadError} />
      </div>
    );
  }

  const languageOptions = FORM_LANGUAGES.includes(
    language as (typeof FORM_LANGUAGES)[number],
  )
    ? FORM_LANGUAGES
    : [language, ...FORM_LANGUAGES];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to={isEdit && entryId ? `/entries/${entryId}` : '/vault'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {isEdit ? 'Back to Entry' : 'Back to My Vault'}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Entry' : 'Create New Entry'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Store a reusable code snippet or parameterized{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
            {'{{variable}}'}
          </code>{' '}
          AI prompt in your vault.
        </p>
      </div>

      {submitError ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {submitError}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div>
          <label
            htmlFor="entry-title"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Title
          </label>
          <input
            id="entry-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g., Zod Env Parser or PR Code Review Prompt"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {fieldErrors.title ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="entry-type"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Entry Type
            </label>
            <select
              id="entry-type"
              value={entryType}
              onChange={(event) => setEntryType(event.target.value as EntryType)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="SNIPPET">Code Snippet</option>
              <option value="PROMPT">AI Prompt</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="entry-language"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Language
            </label>
            <select
              id="entry-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {languageOptions.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            {fieldErrors.language ? (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.language}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="entry-category"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Category
            </label>
            <select
              id="entry-category"
              value={categoryId === null ? '' : String(categoryId)}
              onChange={(event) =>
                setCategoryId(event.target.value ? Number(event.target.value) : null)
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="entry-visibility"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Visibility
            </label>
            <select
              id="entry-visibility"
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as EntryVisibility)
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="PUBLIC">Public (Explore)</option>
              <option value="PRIVATE">Private (Only Me)</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="entry-description"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <input
            id="entry-description"
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Brief summary of when to use this snippet or prompt..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {fieldErrors.description ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
          ) : null}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label
              htmlFor="entry-content"
              className="block text-sm font-medium text-slate-700"
            >
              Content
            </label>
            {detectedVars.length > 0 ? (
              <span className="text-xs font-medium text-emerald-700">
                Detected variables: {detectedVars.map((v) => `{{${v}}}`).join(', ')}
              </span>
            ) : null}
          </div>
          <textarea
            id="entry-content"
            rows={10}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={
              entryType === 'PROMPT'
                ? 'Write prompt template using {{variable}} placeholders...'
                : 'Paste reusable code snippet...'
            }
            className="w-full rounded-md border border-slate-300 bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {fieldErrors.content ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.content}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="entry-tag-input"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Add Tags (max 8)
          </label>
          <div className="flex gap-2">
            <input
              id="entry-tag-input"
              type="text"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="e.g., typescript, code-review"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Tag
            </button>
          </div>
          {fieldErrors.tags ? (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.tags}</p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Link
            to={isEdit && entryId ? `/entries/${entryId}` : '/vault'}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting
              ? 'Saving...'
              : isEdit
                ? 'Save Changes'
                : 'Save Entry'}
          </button>
        </div>
      </form>

      <AiAssistantPanel
        entryType={entryType}
        language={language}
        title={title}
        content={content}
        onApplyTags={handleApplyAiTags}
        onApplyContent={handleApplyAiContent}
      />
    </div>
  );
}
