import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name cannot exceed 50 characters'),
  description: z
    .string()
    .trim()
    .max(300, 'Description cannot exceed 300 characters')
    .optional()
    .default(''),
});

export const updateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Category name must be at least 2 characters')
      .max(50, 'Category name cannot exceed 50 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(300, 'Description cannot exceed 300 characters')
      .optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    { message: 'Provide at least name or description to update' },
  );

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
