import { Router } from 'express';
import {
  createCuratedSkillHandler,
  deleteCuratedSkillHandler,
  listCuratedSkillsHandler,
  updateCuratedSkillHandler,
} from '../controllers/curatedSkill.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';
import {
  createCuratedSkillSchema,
  listCuratedSkillsQuerySchema,
  updateCuratedSkillSchema,
} from '../validators/curatedSkill.schema.js';

const router = Router();

router.get('/', validateQuery(listCuratedSkillsQuerySchema), listCuratedSkillsHandler);
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validateBody(createCuratedSkillSchema),
  createCuratedSkillHandler,
);
router.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  validateBody(updateCuratedSkillSchema),
  updateCuratedSkillHandler,
);
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  deleteCuratedSkillHandler,
);

export default router;
