import { Router, Response } from 'express';
import { favoritesService, createFavoriteSchema, updateFavoriteSchema, reorderFavoritesSchema } from './favorites.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('favorites', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const favorites = await favoritesService.findAll(req.user!.userId);
      res.json({ success: true, data: favorites });
    } catch (error) { next(error); }
  }
);

router.get('/:id', authorize('favorites', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const favorite = await favoritesService.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: favorite });
    } catch (error) { next(error); }
  }
);

router.post('/', authorize('favorites', 'create'), validateBody(createFavoriteSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const favorite = await favoritesService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: favorite });
    } catch (error) { next(error); }
  }
);

router.put('/:id', authorize('favorites', 'update'), validateBody(updateFavoriteSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const favorite = await favoritesService.update(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: favorite });
    } catch (error) { next(error); }
  }
);

router.delete('/:id', authorize('favorites', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await favoritesService.delete(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Favorite deleted' } });
    } catch (error) { next(error); }
  }
);

router.post('/reorder', authorize('favorites', 'update'), validateBody(reorderFavoritesSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await favoritesService.reorder(req.user!.userId, req.body.items);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

export const favoritesRouter = router;
