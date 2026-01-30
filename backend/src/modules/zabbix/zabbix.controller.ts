import { Router, Response } from 'express';
import { zabbixService, createZabbixSchema, updateZabbixSchema, zabbixQuerySchema } from './zabbix.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { parsePagination } from '../../utils/pagination.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('zabbix', 'read'), validateQuery(zabbixQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const pagination = parsePagination(req.query);
      const result = await zabbixService.findAll(req.user!.userId, req.query as never, pagination);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

router.get('/:id', authorize('zabbix', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const item = await zabbixService.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: item });
    } catch (error) { next(error); }
  }
);

router.post('/', authorize('zabbix', 'create'), validateBody(createZabbixSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const item = await zabbixService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) { next(error); }
  }
);

router.put('/:id', authorize('zabbix', 'update'), validateBody(updateZabbixSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const item = await zabbixService.update(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: item });
    } catch (error) { next(error); }
  }
);

router.delete('/:id', authorize('zabbix', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await zabbixService.delete(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Zabbix item deleted' } });
    } catch (error) { next(error); }
  }
);

router.post('/:id/favorite', authorize('zabbix', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await zabbixService.toggleFavorite(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

export const zabbixRouter = router;
