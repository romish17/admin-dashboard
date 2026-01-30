import { Router, Response } from 'express';
import { rssService, createFeedSchema, updateFeedSchema, feedQuerySchema, itemQuerySchema } from './rss.service.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { parsePagination } from '../../utils/pagination.js';

const router = Router();
router.use(authenticate);

// === Feeds ===
router.get('/feeds', authorize('rss', 'read'), validateQuery(feedQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const feeds = await rssService.findAllFeeds(req.user!.userId, req.query as never);
      res.json({ success: true, data: feeds });
    } catch (error) { next(error); }
  }
);

router.get('/feeds/:id', authorize('rss', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const feed = await rssService.findFeedById(req.params.id, req.user!.userId);
      res.json({ success: true, data: feed });
    } catch (error) { next(error); }
  }
);

router.post('/feeds', authorize('rss', 'create'), validateBody(createFeedSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const feed = await rssService.createFeed(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: feed });
    } catch (error) { next(error); }
  }
);

router.put('/feeds/:id', authorize('rss', 'update'), validateBody(updateFeedSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const feed = await rssService.updateFeed(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: feed });
    } catch (error) { next(error); }
  }
);

router.delete('/feeds/:id', authorize('rss', 'delete'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await rssService.deleteFeed(req.params.id, req.user!.userId);
      res.json({ success: true, data: { message: 'Feed deleted' } });
    } catch (error) { next(error); }
  }
);

router.post('/feeds/:id/refresh', authorize('rss', 'refresh'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await rssService.refreshFeed(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

router.post('/feeds/refresh-all', authorize('rss', 'refresh'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await rssService.refreshAllFeeds(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

// === Items ===
router.get('/items', authorize('rss', 'read'), validateQuery(itemQuerySchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const pagination = parsePagination(req.query);
      const result = await rssService.findAllItems(req.user!.userId, req.query as never, pagination);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

router.get('/items/dashboard', authorize('rss', 'read'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const items = await rssService.getDashboardItems(req.user!.userId);
      res.json({ success: true, data: items });
    } catch (error) { next(error); }
  }
);

router.post('/items/:id/read', authorize('rss', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const item = await rssService.markItemAsRead(req.params.id, req.user!.userId);
      res.json({ success: true, data: item });
    } catch (error) { next(error); }
  }
);

router.post('/items/:id/star', authorize('rss', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const item = await rssService.toggleItemStarred(req.params.id, req.user!.userId);
      res.json({ success: true, data: item });
    } catch (error) { next(error); }
  }
);

router.post('/items/mark-all-read', authorize('rss', 'update'),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const result = await rssService.markAllAsRead(req.user!.userId, req.query.feedId as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
);

export const rssRouter = router;
