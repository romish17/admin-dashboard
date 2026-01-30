import { Router, Response } from 'express';
import { todosService } from './todos.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { parsePagination } from '../../utils/pagination.js';
import {
  createProjectSchema, updateProjectSchema,
  createTodoSchema, updateTodoSchema, todoQuerySchema, bulkUpdateTodosSchema,
} from './todos.schema.js';

const router = Router();
router.use(authenticate);

// === Projects ===
router.get('/projects', authorize('todos', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const projects = await todosService.findAllProjects(req.user!.userId);
      res.json({ success: true, data: projects });
    } catch (error) { next(error); }
  }
);

router.get('/projects/:id', authorize('todos', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const project = await todosService.findProjectById(req.params.id, req.user!.userId);
      res.json({ success: true, data: project });
    } catch (error) { next(error); }
  }
);

router.post('/projects', authorize('todos', 'create'), validateBody(createProjectSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const project = await todosService.createProject(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: project });
    } catch (error) { next(error); }
  }
);

router.put('/projects/:id', authorize('todos', 'update'), validateBody(updateProjectSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const project = await todosService.updateProject(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: project });
    } catch (error) { next(error); }
  }
);

router.delete('/projects/:id', authorize('todos', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await todosService.deleteProject(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Project deleted' } });
    } catch (error) { next(error); }
  }
);

// === Todos ===
router.get('/', authorize('todos', 'read'), validateQuery(todoQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const pagination = parsePagination(req.query);
      const result = await todosService.findAllTodos(req.user!.userId, req.query as never, pagination);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

router.get('/dashboard', authorize('todos', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const todos = await todosService.getDashboardTodos(req.user!.userId);
      res.json({ success: true, data: todos });
    } catch (error) { next(error); }
  }
);

router.get('/:id', authorize('todos', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const todo = await todosService.findTodoById(req.params.id, req.user!.userId);
      res.json({ success: true, data: todo });
    } catch (error) { next(error); }
  }
);

router.post('/', authorize('todos', 'create'), validateBody(createTodoSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const todo = await todosService.createTodo(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: todo });
    } catch (error) { next(error); }
  }
);

router.put('/:id', authorize('todos', 'update'), validateBody(updateTodoSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const todo = await todosService.updateTodo(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: todo });
    } catch (error) { next(error); }
  }
);

router.delete('/:id', authorize('todos', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await todosService.deleteTodo(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Todo deleted' } });
    } catch (error) { next(error); }
  }
);

router.post('/:id/toggle', authorize('todos', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const todo = await todosService.toggleTodoStatus(req.params.id, req.user!.userId);
      res.json({ success: true, data: todo });
    } catch (error) { next(error); }
  }
);

router.post('/:id/favorite', authorize('todos', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await todosService.toggleFavorite(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

router.post('/:id/pin', authorize('todos', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await todosService.togglePinned(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

router.post('/bulk', authorize('todos', 'update'), validateBody(bulkUpdateTodosSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await todosService.bulkUpdate(req.user!.userId, req.body);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

export const todosRouter = router;
