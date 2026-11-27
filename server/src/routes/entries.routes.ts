import { Router } from 'express';
import {
  deleteBookmarkHandler,
  postBookmarkHandler,
} from '../controllers/bookmark.controller.js';
import {
  createEntryHandler,
  deleteEntryHandler,
  getEntryDetailHandler,
  listMyEntriesHandler,
  listPublicEntriesHandler,
  updateEntryHandler,
} from '../controllers/entry.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';
import {
  createEntrySchema,
  listEntriesQuerySchema,
  updateEntrySchema,
} from '../validators/entry.schema.js';

const router = Router();

router.get('/mine', authenticate, listMyEntriesHandler);
router.get('/', optionalAuth, validateQuery(listEntriesQuerySchema), listPublicEntriesHandler);
router.post('/', authenticate, validateBody(createEntrySchema), createEntryHandler);
router.get('/:id', optionalAuth, getEntryDetailHandler);
router.patch('/:id', authenticate, validateBody(updateEntrySchema), updateEntryHandler);
router.delete('/:id', authenticate, deleteEntryHandler);
router.post('/:id/bookmark', authenticate, postBookmarkHandler);
router.delete('/:id/bookmark', authenticate, deleteBookmarkHandler);

export default router;
