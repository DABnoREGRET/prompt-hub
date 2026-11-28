import type { EntryType } from './entry';

export type AiAnalyzeMode = 'explain' | 'improve' | 'suggest-tags';

export interface AiAnalyzeRequest {
  mode: AiAnalyzeMode;
  entryType: EntryType;
  language: string;
  title?: string;
  content: string;
}

export interface AiAnalysisResult {
  mode: AiAnalyzeMode;
  source: 'gemini' | 'heuristic';
  summary: string;
  suggestions: string[];
  suggestedTags: string[];
  improvedContent?: string;
  detectedVariables: string[];
}
