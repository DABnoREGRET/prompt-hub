import { Check, Copy, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext';

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export function extractPromptVariables(content: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    const name = match[1]?.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      ordered.push(name);
    }
  }
  return ordered;
}

export function interpolatePrompt(
  content: string,
  values: Record<string, string>,
): string {
  return content.replace(VARIABLE_PATTERN, (fullMatch, rawName: string) => {
    const key = rawName.trim();
    const val = values[key];
    return val !== undefined && val !== '' ? val : fullMatch;
  });
}

export function PromptPlayground({ content }: { content: string }) {
  const { showToast } = useToast();
  const variables = useMemo(() => extractPromptVariables(content), [content]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setValues({});
  }, [content]);

  const compiledPrompt = useMemo(
    () => interpolatePrompt(content, values),
    [content, values],
  );

  const handleCopyCompiled = async () => {
    try {
      await navigator.clipboard?.writeText(compiledPrompt);
      setCopied(true);
      showToast('Copied compiled prompt to clipboard', 'success');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast('Clipboard access unavailable in this browser context', 'error');
    }
  };

  const hasFilledValues = Object.values(values).some((val) => val.length > 0);

  return (
    <section
      aria-label="Prompt Playground"
      className="space-y-4 rounded-md border border-[var(--p-hairline)] bg-[var(--p-surface)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--p-accent)] text-[var(--p-accent-ink)]">
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-base font-medium text-[var(--p-ink)]">
              Interactive Prompt Playground
            </h2>
            <p className="text-xs text-[var(--p-muted)]">
              {variables.length > 0
                ? `Fill ${variables.length} template ${variables.length === 1 ? 'variable' : 'variables'} to render and copy the compiled prompt.`
                : 'No {{variables}} detected in this prompt template.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {variables.length > 0 && hasFilledValues ? (
            <button
              type="button"
              onClick={() => setValues({})}
              className="btn-tactile inline-flex items-center gap-1 rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--p-ink)] hover:border-[var(--p-accent)]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset Variables
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleCopyCompiled}
            className="btn-tactile inline-flex items-center gap-1.5 rounded bg-[var(--p-accent)] px-3 py-1.5 text-xs font-medium text-[var(--p-accent-ink)]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Copied Compiled
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy Compiled Prompt
              </>
            )}
          </button>
        </div>
      </div>

      {variables.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {variables.map((variable) => {
            const inputId = `playground-var-${variable}`;
            return (
              <div key={variable}>
                <label
                  htmlFor={inputId}
                  className="mb-1 block font-mono text-xs font-medium text-[var(--p-ink)]"
                >
                  {variable}
                </label>
                <input
                  id={inputId}
                  type="text"
                  value={values[variable] ?? ''}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      [variable]: event.target.value,
                    }))
                  }
                  placeholder={`Enter ${variable}...`}
                  className="h-9 w-full rounded border border-[var(--p-hairline)] bg-[var(--p-bg)] px-3 text-sm text-[var(--p-ink)] placeholder:text-[var(--p-muted)] focus:border-[var(--p-accent)] focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      ) : null}

      <div>
        <p className="mb-1.5 font-mono text-xs font-medium uppercase tracking-wide text-[var(--p-muted)]">
          Compiled Output
        </p>
        <pre className="max-h-72 overflow-x-auto whitespace-pre-wrap rounded border border-[var(--p-hairline)] bg-[var(--p-code-bg)] p-4 font-mono text-xs leading-relaxed text-[var(--p-code-ink)]">
          <code>{compiledPrompt}</code>
        </pre>
      </div>
    </section>
  );
}
