import { Router, Response } from 'express';
import { notesService } from './notes.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { parsePagination } from '../../utils/pagination.js';
import { createNoteSchema, updateNoteSchema, noteQuerySchema } from './notes.schema.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('notes', 'read'), validateQuery(noteQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const pagination = parsePagination(req.query);
      const result = await notesService.findAll(req.user!.userId, req.query as never, pagination);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }
);

router.get('/:id', authorize('notes', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const note = await notesService.findById(req.params.id, req.user!.userId);
      res.json({ success: true, data: note });
    } catch (error) { next(error); }
  }
);

router.post('/', authorize('notes', 'create'), validateBody(createNoteSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const note = await notesService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: note });
    } catch (error) { next(error); }
  }
);

router.put('/:id', authorize('notes', 'update'), validateBody(updateNoteSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const note = await notesService.update(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: note });
    } catch (error) { next(error); }
  }
);

router.delete('/:id', authorize('notes', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await notesService.delete(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Note deleted' } });
    } catch (error) { next(error); }
  }
);

router.post('/:id/favorite', authorize('notes', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await notesService.toggleFavorite(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

router.post('/:id/pin', authorize('notes', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await notesService.togglePinned(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

export const notesRouter = router;
