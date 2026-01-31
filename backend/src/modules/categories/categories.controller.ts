import { Router, Response } from 'express';
import { categoriesService, createCategorySchema, updateCategorySchema } from './categories.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('categories', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const section = req.query.section as string | undefined;
      const categories = await categoriesService.findAll(req.user!.userId, section);
      res.json({ success: true, data: categories });
    } catch (error) { next(error); }
  }
);

router.get('/:id', authorize('categories', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const category = await categoriesService.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: category });
    } catch (error) { next(error); }
  }
);

router.post('/', authorize('categories', 'create'), validateBody(createCategorySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const category = await categoriesService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) { next(error); }
  }
);

router.put('/:id', authorize('categories', 'update'), validateBody(updateCategorySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const category = await categoriesService.update(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: category });
    } catch (error) { next(error); }
  }
);

router.delete('/:id', authorize('categories', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await categoriesService.delete(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Category deleted' } });
    } catch (error) { next(error); }
  }
);

export const categoriesRouter = router;
