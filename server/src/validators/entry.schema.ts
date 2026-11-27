import { z } from 'zod';
import { toSlug } from '../utils/slug.js';

export function normalizeTagList(rawTags: string[]): string[] {
  const cleaned = rawTags
    .map((tag) => toSlug(tag))
    .filter((tag) => tag.length >= 1 && tag.length <= 24);
  return Array.from(new Set(cleaned)).sort();
}

export const createEntrySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  entryType: z.enum(['SNIPPET', 'PROMPT']),
  language: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Language is required')
    .max(40, 'Language cannot exceed 40 characters'),
  categoryId: z.number().int().positive().nullable().optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .default(''),
  content: z
    .string()
    .trim()
    .min(10, 'Content must be at least 10 characters')
    .max(20000, 'Content cannot exceed 20,000 characters'),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional().default('PUBLIC'),
  tags: z
    .array(z.string().trim().min(1).max(24))
    .max(8, 'Cannot attach more than 8 tags')
    .optional()
    .default([]),
});

export const updateEntrySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title cannot exceed 120 characters')
      .optional(),
    entryType: z.enum(['SNIPPET', 'PROMPT']).optional(),
    language: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Language is required')
      .max(40, 'Language cannot exceed 40 characters')
      .optional(),
    categoryId: z.number().int().positive().nullable().optional(),
    description: z
      .string()
      .trim()
      .max(500, 'Description cannot exceed 500 characters')
      .optional(),
    content: z
      .string()
      .trim()
      .min(10, 'Content must be at least 10 characters')
      .max(20000, 'Content cannot exceed 20,000 characters')
      .optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
    tags: z
      .array(z.string().trim().min(1).max(24))
      .max(8, 'Cannot attach more than 8 tags')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listEntriesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.enum(['SNIPPET', 'PROMPT']).optional(),
  category: z.string().trim().max(60).optional(),
  language: z.string().trim().toLowerCase().max(40).optional(),
  tag: z.string().trim().toLowerCase().max(24).optional(),
  sortBy: z.enum(['newest', 'popular', 'title']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;
