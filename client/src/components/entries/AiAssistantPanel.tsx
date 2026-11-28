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
      setError('Enter at least 10 characters of code or prompt text to run AI analysis.');
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
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              AI Vault Assistant
            </h2>
            <p className="text-xs text-slate-600">
              Explain logic, suggest improvements, or extract discovery tags.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loadingMode !== null}
            onClick={() => void runAnalysis('explain')}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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
            className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
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
          className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Analysis ({result.mode})
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {result.source === 'gemini' ? 'Gemini AI' : 'Smart Analyzer'}
            </span>
          </div>

          <p className="text-sm text-slate-800">{result.summary}</p>

          {result.suggestions.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-700">
              {result.suggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {result.suggestedTags.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2.5">
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-white px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              {onApplyTags ? (
                <button
                  type="button"
                  onClick={() => onApplyTags(result.suggestedTags)}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Apply Suggested Tags
                </button>
              ) : null}
            </div>
          ) : null}

          {result.improvedContent ? (
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Suggested Revision
                </span>
                {onApplyContent ? (
                  <button
                    type="button"
                    onClick={() => onApplyContent(result.improvedContent!)}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Apply Improved Content
                  </button>
                ) : null}
              </div>
              <pre className="max-h-48 overflow-x-auto whitespace-pre-wrap rounded-md bg-slate-900 p-3 font-mono text-xs text-slate-100">
                <code>{result.improvedContent}</code>
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
