import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bookmarksRoutes from './bookmarks.routes.js';
import categoriesRoutes from './categories.routes.js';
import entriesRoutes from './entries.routes.js';
import healthRoutes from './health.routes.js';
import tagsRoutes from './tags.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/tags', tagsRoutes);
apiRouter.use('/entries', entriesRoutes);
apiRouter.use('/bookmarks', bookmarksRoutes);

export default apiRouter;
