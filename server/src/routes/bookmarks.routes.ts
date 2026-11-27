import { Router } from 'express';
import { listBookmarksHandler } from '../controllers/bookmark.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, listBookmarksHandler);

export default router;
