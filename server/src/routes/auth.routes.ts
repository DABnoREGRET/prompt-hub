import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.schema.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
