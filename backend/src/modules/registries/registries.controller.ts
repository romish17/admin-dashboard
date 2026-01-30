import { Router, Response } from 'express';
import { registriesService } from './registries.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { parsePagination } from '../../utils/pagination.js';
import {
  createRegistrySchema,
  updateRegistrySchema,
  registryQuerySchema,
  exportRegistrySchema,
  RegistryQueryInput,
} from './registries.schema.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/registries
router.get(
  '/',
  authorize('registries', 'read'),
  validateQuery(registryQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const pagination = parsePagination(req.query);
      const result = await registriesService.findAll(
        req.user!.userId,
        req.query as unknown as RegistryQueryInput,
        pagination
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/registries/:id
router.get(
  '/:id',
  authorize('registries', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const entry = await registriesService.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/registries
router.post(
  '/',
  authorize('registries', 'create'),
  validateBody(createRegistrySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const entry = await registriesService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/registries/:id
router.put(
  '/:id',
  authorize('registries', 'update'),
  validateBody(updateRegistrySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const entry = await registriesService.update(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/registries/:id
router.delete(
  '/:id',
  authorize('registries', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await registriesService.delete(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Registry entry deleted' } });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/registries/:id/favorite
router.post(
  '/:id/favorite',
  authorize('registries', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await registriesService.toggleFavorite(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/registries/export
router.post(
  '/export',
  authorize('registries', 'export'),
  validateBody(exportRegistrySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const regContent = await registriesService.exportToReg(req.body.ids, req.user!.userId);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="registry_export.reg"');
      res.send(regContent);
    } catch (error) {
      next(error);
    }
  }
);

export const registriesRouter = router;
