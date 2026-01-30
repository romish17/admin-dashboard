import { Router, Response } from 'express';
import { searchService, searchQuerySchema } from './search.service.js';
import { authenticate } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';

const router = Router();
router.use(authenticate);

// GET /api/v1/search?q=query&modules=script,note&tags=tag1,tag2
router.get('/', validateQuery(searchQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await searchService.globalSearch(req.user!.userId, req.query as never);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

// GET /api/v1/search/suggestions?q=query
router.get('/suggestions',
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        res.json({ success: true, data: [] });
        return;
      }
      const suggestions = await searchService.getSearchSuggestions(req.user!.userId, query);
      res.json({ success: true, data: suggestions });
    } catch (error) { next(error); }
  }
);

export const searchRouter = router;
