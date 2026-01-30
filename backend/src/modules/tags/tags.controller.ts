import { Router, Response } from 'express';
import { tagsService, createTagSchema, updateTagSchema } from './tags.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

router.get('/', authorize('tags', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const tags = await tagsService.findAll(req.user!.userId);
      res.json({ success: true, data: tags });
    } catch (error) { next(error); }
  }
);

router.get('/:id', authorize('tags', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const tag = await tagsService.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: tag });
    } catch (error) { next(error); }
  }
);

router.post('/', authorize('tags', 'create'), validateBody(createTagSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const tag = await tagsService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: tag });
    } catch (error) { next(error); }
  }
);

router.post('/bulk', authorize('tags', 'create'),
  validateBody(z.object({ names: z.array(z.string().min(1).max(30)).min(1) })),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const tags = await tagsService.bulkCreate(req.user!.userId, req.body.names);
      res.status(201).json({ success: true, data: tags });
    } catch (error) { next(error); }
  }
);

router.put('/:id', authorize('tags', 'update'), validateBody(updateTagSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const tag = await tagsService.update(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: tag });
    } catch (error) { next(error); }
  }
);

router.delete('/:id', authorize('tags', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await tagsService.delete(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Tag deleted' } });
    } catch (error) { next(error); }
  }
);

export const tagsRouter = router;
