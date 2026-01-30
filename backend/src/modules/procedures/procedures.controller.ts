import { Router, Response } from 'express';
import { proceduresService, createProcedureSchema, updateProcedureSchema, procedureQuerySchema } from './procedures.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { parsePagination } from '../../utils/pagination.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('procedures', 'read'), validateQuery(procedureQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const pagination = parsePagination(req.query);
      const result = await proceduresService.findAll(req.user!.userId, req.query as never, pagination);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }
);

router.get('/:id', authorize('procedures', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const procedure = await proceduresService.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: procedure });
    } catch (error) { next(error); }
  }
);

router.post('/', authorize('procedures', 'create'), validateBody(createProcedureSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const procedure = await proceduresService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: procedure });
    } catch (error) { next(error); }
  }
);

router.put('/:id', authorize('procedures', 'update'), validateBody(updateProcedureSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const procedure = await proceduresService.update(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: procedure });
    } catch (error) { next(error); }
  }
);

router.delete('/:id', authorize('procedures', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await proceduresService.delete(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Procedure deleted' } });
    } catch (error) { next(error); }
  }
);

router.post('/:id/favorite', authorize('procedures', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await proceduresService.toggleFavorite(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

export const proceduresRouter = router;
