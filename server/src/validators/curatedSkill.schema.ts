import { z } from 'zod';

const httpUrlSchema = z
  .string()
  .trim()
  .url('Must be a valid HTTP/HTTPS URL')
  .max(500, 'URL cannot exceed 500 characters')
  .refine((val) => /^https?:\/\//i.test(val), {
    message: 'URL must start with http:// or https://',
  });

export const createCuratedSkillSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  harness: z
    .string()
    .trim()
    .min(2, 'Target harness is required')
    .max(60, 'Harness cannot exceed 60 characters'),
  category: z
    .string()
    .trim()
    .min(2, 'Category is required')
    .max(60, 'Category cannot exceed 60 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .default(''),
  repoUrl: httpUrlSchema,
  docsUrl: z
    .string()
    .trim()
    .max(500)
    .refine((val) => val === '' || /^https?:\/\//i.test(val), {
      message: 'Docs URL must start with http:// or https://',
    })
    .optional()
    .default(''),
  installCommand: z.string().trim().max(255).optional().default(''),
  skillMdContent: z
    .string()
    .trim()
    .min(10, 'SKILL.md content must be at least 10 characters')
    .max(20000, 'SKILL.md content cannot exceed 20,000 characters'),
  tags: z.array(z.string().trim().min(1).max(24)).max(8).optional().default([]),
  isFeatured: z.boolean().optional().default(true),
});

export const updateCuratedSkillSchema = z
  .object({
    title: z.string().trim().min(2).max(120).optional(),
    harness: z.string().trim().min(2).max(60).optional(),
    category: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(500).optional(),
    repoUrl: httpUrlSchema.optional(),
    docsUrl: z
      .string()
      .trim()
      .max(500)
      .refine((val) => val === '' || /^https?:\/\//i.test(val), {
        message: 'Docs URL must start with http:// or https://',
      })
      .optional(),
    installCommand: z.string().trim().max(255).optional(),
    skillMdContent: z.string().trim().min(10).max(20000).optional(),
    tags: z.array(z.string().trim().min(1).max(24)).max(8).optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listCuratedSkillsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  harness: z.string().trim().max(60).optional(),
  category: z.string().trim().max(60).optional(),
});

export type CreateCuratedSkillInput = z.infer<typeof createCuratedSkillSchema>;
export type UpdateCuratedSkillInput = z.infer<typeof updateCuratedSkillSchema>;
export type ListCuratedSkillsQuery = z.infer<typeof listCuratedSkillsQuerySchema>;
