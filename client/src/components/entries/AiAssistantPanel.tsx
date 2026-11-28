import { Check, Loader2, Sparkles, Tag, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { analyzeEntryWithAi } from '../../api/ai.api';
import { ApiClientError } from '../../api/client';
import type { AiAnalysisResult, AiAnalyzeMode } from '../../types/ai';
import type { EntryType } from '../../types/entry';

interface AiAssistantPanelProps {
  entryType: EntryType;
  language: string;
  title?: string;
  content: string;
  onApplyTags?: (tags: string[]) => void;
  onApplyContent?: (improvedContent: string) => void;
}

export function AiAssistantPanel({
  entryType,
  language,
  title,
  content,
  onApplyTags,
  onApplyContent,
}: AiAssistantPanelProps) {
  const [loadingMode, setLoadingMode] = useState<AiAnalyzeMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiAnalysisResult | null>(null);

  const runAnalysis = async (mode: AiAnalyzeMode) => {
    const trimmed = content.trim();
    if (trimmed.length < 10) {
      setError('Enter at least 10 characters of code, prompt, or SKILL.md text to run AI analysis.');
      return;
    }

    setLoadingMode(mode);
    setError(null);
    try {
      const res = await analyzeEntryWithAi({
        mode,
        entryType,
        language: language || 'plaintext',
        title,
        content: trimmed,
      });
      setResult(res.analysis);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to run AI assistant analysis.',
      );
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <section
      aria-label="AI Snippet and Prompt Assistant"
      className="space-y-4 rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--p-accent)] text-[var(--p-accent-ink)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-sm font-medium text-[var(--p-ink)]">
              AI Vault Assistant
            </h2>
            <p className="text-xs text-[var(--p-muted)]">
              Explain logic, refine prompts or SKILL.md workflows, and extract tags.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loadingMode !== null}
            onClick={() => void runAnalysis('explain')}
            className="btn-tactile inline-flex items-center gap-1 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)] disabled:opacity-60"
          >
            {loadingMode === 'explain' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Explain
          </button>

          <button
            type="button"
            disabled={loadingMode !== null}
            onClick={() => void runAnalysis('improve')}
            className="btn-tactile inline-flex items-center gap-1 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)] disabled:opacity-60"
          >
            {loadingMode === 'improve' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Improve
          </button>

          <button
            type="button"
            disabled={loadingMode !== null}
            onClick={() => void runAnalysis('suggest-tags')}
            className="btn-tactile inline-flex items-center gap-1 rounded bg-[var(--p-accent)] px-2.5 py-1.5 text-xs font-medium text-[var(--p-accent-ink)] disabled:opacity-60"
          >
            {loadingMode === 'suggest-tags' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Tag className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Suggest Tags
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-500 dark:text-rose-300"
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs font-medium uppercase tracking-wide text-[var(--p-muted)]">
              Analysis ({result.mode})
            </span>
            <span className="rounded border border-[var(--p-hairline)] bg-[var(--p-surface)] px-2 py-0.5 font-mono text-xs text-[var(--p-ink)]">
              {result.source === 'gemini' ? 'Gemini AI' : 'Smart Analyzer'}
            </span>
          </div>

          <p className="text-sm text-[var(--p-ink)]">{result.summary}</p>

          {result.suggestions.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--p-muted)]">
              {result.suggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {result.suggestedTags.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--p-hairline)] pt-2.5">
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-[var(--p-hairline)] bg-[var(--p-surface)] px-2 py-0.5 font-mono text-xs text-[var(--p-ink)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              {onApplyTags ? (
                <button
                  type="button"
                  onClick={() => onApplyTags(result.suggestedTags)}
                  className="btn-tactile inline-flex items-center gap-1 rounded bg-[var(--p-accent)] px-2.5 py-1 text-xs font-medium text-[var(--p-accent-ink)]"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Apply Suggested Tags
                </button>
              ) : null}
            </div>
          ) : null}

          {result.improvedContent ? (
            <div className="space-y-2 border-t border-[var(--p-hairline)] pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--p-ink)]">
                  Suggested Revision
                </span>
                {onApplyContent ? (
                  <button
                    type="button"
                    onClick={() => onApplyContent(result.improvedContent!)}
                    className="btn-tactile inline-flex items-center gap-1 rounded bg-[var(--p-accent)] px-2.5 py-1 text-xs font-medium text-[var(--p-accent-ink)]"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Apply Improved Content
                  </button>
                ) : null}
              </div>
              <pre className="max-h-48 overflow-x-auto whitespace-pre-wrap rounded border border-[var(--p-hairline)] bg-[var(--p-code-bg)] p-3 font-mono text-xs text-[var(--p-code-ink)]">
                <code>{result.improvedContent}</code>
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
