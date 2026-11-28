import { env } from '../config/env.js';
import { AnalyzeAiInput, geminiOutputSchema } from '../validators/ai.schema.js';
import { normalizeTagList } from '../validators/entry.schema.js';

export interface AiAnalysisResult {
  mode: AnalyzeAiInput['mode'];
  source: 'gemini' | 'heuristic';
  summary: string;
  suggestions: string[];
  suggestedTags: string[];
  improvedContent?: string;
  detectedVariables: string[];
}

const KEYWORD_TAG_RULES: Array<[RegExp, string]> = [
  [/\bzod\b/i, 'zod'],
  [/\bexpress\b|\brouter\b|\bmiddleware\b/i, 'express'],
  [/\breact\b|\buseeffect\b|\busestate\b/i, 'react'],
  [/\bselect\b|\binsert\b|\bpostgres\b|\bpostgresql\b|\bpg\b/i, 'postgres'],
  [/\bjwt\b|\bbcrypt\b|\bauth\b|\bowasp\b|\bsecurity\b/i, 'security'],
  [/\bdocker\b|\bfrom\s+node\b/i, 'docker'],
  [/\bvitest\b|\bjest\b|\bsupertest\b|\btest\b|\btdd\b/i, 'testing'],
  [/\btailwind\b|\bcss\b/i, 'tailwind'],
  [/\basync\b|\bfetch\b|\bpromise\b/i, 'async'],
  [/\bgithub\b|\bci\b|\bworkflow\b/i, 'ci-cd'],
  [/\breview\b|\baudit\b|\brefactor\b/i, 'code-review'],
  [/\bincident\b|\bpostmortem\b/i, 'incident'],
  [/\bsql\b|\bquery\b|\bindex\b/i, 'sql'],
  [/skill\.md|\bfrontmatter\b|\bharness\b|\bmcp\b/i, 'ai-harness'],
];

export function extractTemplateVariables(content: string): string[] {
  const matches = content.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g);
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const match of matches) {
    const name = match[1]?.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      ordered.push(name);
    }
  }
  return ordered;
}

function buildSuggestedTags(input: AnalyzeAiInput, detectedVariables: string[]): string[] {
  const raw: string[] = [];
  if (input.language && input.language !== 'plaintext') {
    raw.push(input.language);
  }
  if (input.entryType === 'SKILL') {
    raw.push('skill-md', 'ai-harness');
  } else {
    raw.push(input.entryType === 'PROMPT' ? 'ai-prompt' : 'code-snippet');
  }
  if (detectedVariables.length > 0) {
    raw.push('template');
  }

  const haystack = `${input.title} ${input.content}`;
  for (const [pattern, tag] of KEYWORD_TAG_RULES) {
    if (pattern.test(haystack)) {
      raw.push(tag);
    }
  }

  return normalizeTagList(raw).slice(0, 6);
}

function buildImprovedContent(
  input: AnalyzeAiInput,
  detectedVariables: string[],
): string {
  const trimmed = input.content.trim();
  if (input.entryType === 'SKILL') {
    const hasFrontmatter = /^---\s*[\r\n]/.test(trimmed);
    if (!hasFrontmatter) {
      const slugName = (input.title || 'custom-skill')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return `---\nname: ${slugName || 'custom-skill'}\ndescription: Trigger this skill when ${slugName.replace(/-/g, ' ')} is needed.\n---\n\n${trimmed}\n\n## Verification\n- Confirm expected output and run workspace tests before completing.`;
    }
    return trimmed.includes('Verification')
      ? trimmed
      : `${trimmed}\n\n## Verification\n- Confirm expected output and run workspace checks before reporting completion.`;
  }

  if (input.entryType === 'PROMPT') {
    const varLine =
      detectedVariables.length > 0
        ? `\n\nInputs: ${detectedVariables.map((v) => `- ${v}: {{${v}}}`).join('\n')}`
        : '';
    return [
      trimmed,
      varLine,
      '\nRequirements:',
      '- Be concise, structured, and concrete.',
      '- Call out edge cases, assumptions, and verification steps.',
    ]
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  const commentPrefix =
    input.language === 'python' || input.language === 'bash' || input.language === 'yaml'
      ? '#'
      : input.language === 'sql'
        ? '--'
        : '//';

  const headerTitle = input.title ? input.title : `${input.language} utility`;
  if (trimmed.startsWith(commentPrefix) || trimmed.startsWith('/**')) {
    return trimmed;
  }
  return `${commentPrefix} ${headerTitle} (${input.language})\n${trimmed}`;
}

export function analyzeHeuristically(input: AnalyzeAiInput): AiAnalysisResult {
  const detectedVariables = extractTemplateVariables(input.content);
  const suggestedTags = buildSuggestedTags(input, detectedVariables);
  const lineCount = input.content.split(/\r?\n/).length;

  const suggestions: string[] = [];
  if (input.entryType === 'SKILL') {
    if (!/^---\s*[\r\n][\s\S]*?\bname:/i.test(input.content)) {
      suggestions.push('Include YAML frontmatter with `name:` and `description:` so AI harnesses auto-discover the SKILL.md trigger.');
    } else {
      suggestions.push('Valid SKILL.md YAML frontmatter detected for portable Claude Code / Codex / Cursor discovery.');
    }
    if (!/verify|check|test|guard|rule/i.test(input.content)) {
      suggestions.push('Add explicit verification steps or guardrails at the bottom of the SKILL.md file.');
    }
  } else if (input.entryType === 'PROMPT') {
    if (detectedVariables.length === 0) {
      suggestions.push(
        'Consider parameterizing repeatable inputs with {{variable}} placeholders for the Prompt Playground.',
      );
    } else {
      suggestions.push(
        `Detected ${detectedVariables.length} template variable(s): ${detectedVariables.map((v) => `{{${v}}}`).join(', ')}.`,
      );
    }
    if (!/output|format|json|markdown|bullet/i.test(input.content)) {
      suggestions.push(
        'Specify the desired output format (e.g., Markdown checklist or JSON schema) for deterministic model responses.',
      );
    }
  } else {
    if (lineCount > 25) {
      suggestions.push('Consider adding concise JSDoc/inline notes explaining edge cases and expected types.');
    } else {
      suggestions.push('Compact utility snippet — add a brief description and clear tags so teammates can find it fast.');
    }
    if (/any\b/i.test(input.content) && input.language === 'typescript') {
      suggestions.push('Replace loose `any` annotations with `unknown` or explicit Zod schemas where practical.');
    }
  }

  if (suggestedTags.length > 0) {
    suggestions.push(`Recommended discovery tags: ${suggestedTags.map((t) => `#${t}`).join(', ')}.`);
  }

  const kindLabel =
    input.entryType === 'SKILL' ? 'SKILL.md agent skill' : input.entryType.toLowerCase();
  const label = input.title ? `"${input.title}"` : `this ${input.language} ${kindLabel}`;
  const summary =
    input.mode === 'suggest-tags'
      ? `Analyzed ${label} across ${lineCount} line(s) and extracted ${suggestedTags.length} discovery tag(s).`
      : input.mode === 'improve'
        ? `Generated a structured refinement for ${label} (${lineCount} line(s), ${detectedVariables.length} template var(s)).`
        : `${label} is a ${lineCount}-line ${input.language} ${kindLabel}${
            detectedVariables.length > 0
              ? ` using placeholders (${detectedVariables.join(', ')})`
              : ''
          }.`;

  return {
    mode: input.mode,
    source: 'heuristic',
    summary,
    suggestions,
    suggestedTags,
    ...(input.mode === 'improve'
      ? { improvedContent: buildImprovedContent(input, detectedVariables) }
      : {}),
    detectedVariables,
  };
}

function buildGeminiPrompt(input: AnalyzeAiInput): string {
  return [
    'You are an assistant inside Prompt Hub, a developer snippet, AI prompt, and SKILL.md vault.',
    `Task mode: ${input.mode}. Entry type: ${input.entryType}. Language: ${input.language}.`,
    input.title ? `Title: ${input.title}` : '',
    'Respond ONLY with strict JSON matching this shape:',
    '{"summary": string, "suggestions": string[], "suggestedTags": string[], "improvedContent"?: string}',
    'Keep suggestedTags lowercase hyphenated slugs (max 6). Include improvedContent only when mode is improve.',
    'Content:',
    input.content,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function analyzeContentService(
  input: AnalyzeAiInput,
): Promise<AiAnalysisResult> {
  const detectedVariables = extractTemplateVariables(input.content);

  if (!env.GEMINI_API_KEY) {
    return analyzeHeuristically(input);
  }

  try {
    const endpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const response = await fetch(`${endpoint}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildGeminiPrompt(input) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      return analyzeHeuristically(input);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return analyzeHeuristically(input);
    }

    const parsedJson = JSON.parse(rawText) as unknown;
    const validated = geminiOutputSchema.safeParse(parsedJson);
    if (!validated.success) {
      return analyzeHeuristically(input);
    }

    const normalizedTags = normalizeTagList(validated.data.suggestedTags).slice(0, 8);
    return {
      mode: input.mode,
      source: 'gemini',
      summary: validated.data.summary,
      suggestions: validated.data.suggestions,
      suggestedTags:
        normalizedTags.length > 0
          ? normalizedTags
          : buildSuggestedTags(input, detectedVariables),
      ...(input.mode === 'improve' && validated.data.improvedContent
        ? { improvedContent: validated.data.improvedContent }
        : {}),
      detectedVariables,
    };
  } catch {
    return analyzeHeuristically(input);
  }
}
