import { Router } from 'express';
import { getCategories } from '../controllers/catalog.controller.js';

const router = Router();

router.get('/', getCategories);

export default router;
