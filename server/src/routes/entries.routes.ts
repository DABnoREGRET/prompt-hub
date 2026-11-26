import { Router } from 'express';
import { getMyEntries, getPublicEntries } from '../controllers/catalog.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/mine', authenticate, getMyEntries);
router.get('/', getPublicEntries);

export default router;
