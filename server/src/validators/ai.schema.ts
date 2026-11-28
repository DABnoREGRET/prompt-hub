import { z } from 'zod';

export const analyzeAiSchema = z.object({
  mode: z.enum(['explain', 'improve', 'suggest-tags']),
  entryType: z.enum(['SNIPPET', 'PROMPT']),
  language: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Language is required')
    .max(40, 'Language cannot exceed 40 characters')
    .optional()
    .default('plaintext'),
  title: z.string().trim().max(120).optional().default(''),
  content: z
    .string()
    .trim()
    .min(10, 'Provide at least 10 characters of code or prompt content to analyze')
    .max(20000, 'Content cannot exceed 20,000 characters'),
});

export const geminiOutputSchema = z.object({
  summary: z.string().trim().min(1),
  suggestions: z.array(z.string().trim().min(1)).max(6).default([]),
  suggestedTags: z.array(z.string().trim().min(1)).max(8).default([]),
  improvedContent: z.string().optional(),
});

export type AnalyzeAiInput = z.infer<typeof analyzeAiSchema>;
