import { Router, Response } from 'express';
import { scriptsService } from './scripts.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { parsePagination } from '../../utils/pagination.js';
import {
  createScriptSchema,
  updateScriptSchema,
  scriptQuerySchema,
} from './scripts.schema.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/scripts
router.get(
  '/',
  authorize('scripts', 'read'),
  validateQuery(scriptQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const pagination = parsePagination(req.query);
      const result = await scriptsService.findAll(
        req.user!.userId,
        req.query as Record<string, string>,
        pagination
      );
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/scripts/:id
router.get(
  '/:id',
  authorize('scripts', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const script = await scriptsService.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: script });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/scripts
router.post(
  '/',
  authorize('scripts', 'create'),
  validateBody(createScriptSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const script = await scriptsService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: script });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/scripts/:id
router.put(
  '/:id',
  authorize('scripts', 'update'),
  validateBody(updateScriptSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const script = await scriptsService.update(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: script });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/scripts/:id
router.patch(
  '/:id',
  authorize('scripts', 'update'),
  validateBody(updateScriptSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const script = await scriptsService.update(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: script });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/scripts/:id
router.delete(
  '/:id',
  authorize('scripts', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await scriptsService.delete(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Script deleted successfully' } });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/scripts/:id/favorite
router.post(
  '/:id/favorite',
  authorize('scripts', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await scriptsService.toggleFavorite(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export const scriptsRouter = router;
