import { Router } from 'express';
import { analyzeContentHandler } from '../controllers/ai.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { analyzeAiSchema } from '../validators/ai.schema.js';

const router = Router();

router.post('/analyze', authenticate, validateBody(analyzeAiSchema), analyzeContentHandler);

export default router;
