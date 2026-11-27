import { Router } from 'express';
import {
  deleteCategory,
  getCategories,
  patchCategory,
  postCategory,
} from '../controllers/category.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/category.schema.js';

const router = Router();

router.get('/', getCategories);
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validateBody(createCategorySchema),
  postCategory,
);
router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validateBody(updateCategorySchema),
  patchCategory,
);
router.delete('/:id', authenticate, requireRole('ADMIN'), deleteCategory);

export default router;
