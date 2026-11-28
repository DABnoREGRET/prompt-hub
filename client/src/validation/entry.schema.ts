import { z } from 'zod';

export function normalizeTagSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

export const entryFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  entryType: z.enum(['SNIPPET', 'PROMPT', 'SKILL']),
  language: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Language is required')
    .max(40, 'Language cannot exceed 40 characters'),
  categoryId: z.number().int().positive().nullable(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters'),
  content: z
    .string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .max(20000, 'Content cannot exceed 20,000 characters'),
  tags: z
    .array(z.string().min(1).max(24))
    .max(8, 'Cannot attach more than 8 tags'),
});

export type EntryFormValues = z.infer<typeof entryFormSchema>;
