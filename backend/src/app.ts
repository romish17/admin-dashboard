import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { morganStream } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routers
import { authRouter } from './modules/auth/auth.controller.js';
import { scriptsRouter } from './modules/scripts/scripts.controller.js';
import { registriesRouter } from './modules/registries/registries.controller.js';
import { notesRouter } from './modules/notes/notes.controller.js';
import { todosRouter } from './modules/todos/todos.controller.js';
import { proceduresRouter } from './modules/procedures/procedures.controller.js';
import { zabbixRouter } from './modules/zabbix/zabbix.controller.js';
import { favoritesRouter } from './modules/favorites/favorites.controller.js';
import { rssRouter } from './modules/rss/rss.controller.js';
import { searchRouter } from './modules/search/search.controller.js';
import { categoriesRouter } from './modules/categories/categories.controller.js';
import { tagsRouter } from './modules/tags/tags.controller.js';

export function createApp() {
  const app = express();

  // Trust proxy (required when behind nginx/load balancer)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: config.isProduction ? undefined : false,
  }));

  // CORS
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (config.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: morganStream }));
  }

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      },
    });
  });

  // API routes
  const apiRouter = express.Router();

  apiRouter.use('/auth', authRouter);
  apiRouter.use('/scripts', scriptsRouter);
  apiRouter.use('/registries', registriesRouter);
  apiRouter.use('/notes', notesRouter);
  apiRouter.use('/todos', todosRouter);
  apiRouter.use('/procedures', proceduresRouter);
  apiRouter.use('/zabbix', zabbixRouter);
  apiRouter.use('/favorites', favoritesRouter);
  apiRouter.use('/rss', rssRouter);
  apiRouter.use('/search', searchRouter);
  apiRouter.use('/categories', categoriesRouter);
  apiRouter.use('/tags', tagsRouter);

  app.use('/api/v1', apiRouter);

  // API documentation endpoint
  app.get('/api', (_req, res) => {
    res.json({
      success: true,
      data: {
        name: 'AdminDashboard API',
        version: 'v1',
        documentation: '/api/docs',
        endpoints: {
          auth: '/api/v1/auth',
          scripts: '/api/v1/scripts',
          registries: '/api/v1/registries',
          notes: '/api/v1/notes',
          todos: '/api/v1/todos',
          procedures: '/api/v1/procedures',
          zabbix: '/api/v1/zabbix',
          favorites: '/api/v1/favorites',
          rss: '/api/v1/rss',
          search: '/api/v1/search',
          categories: '/api/v1/categories',
          tags: '/api/v1/tags',
        },
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
