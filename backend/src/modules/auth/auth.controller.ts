import { Router, Response } from 'express';
import { authService } from './auth.service.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { AuthenticatedRequest } from '../../types/index.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from './auth.schema.js';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  validateBody(registerSchema),
  async (req, res: Response, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/login',
  validateBody(loginSchema),
  async (req, res: Response, next) => {
    try {
      const result = await authService.login(req.body);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  async (req, res: Response, next) => {
    try {
      const tokens = await authService.refreshTokens(req.body.refreshToken);
      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/logout
router.post(
  '/logout',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await authService.logout(req.user!.userId);
      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/auth/me
router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/auth/me
router.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/auth/change-password
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      await authService.changePassword(req.user!.userId, req.body);
      res.json({
        success: true,
        data: { message: 'Password changed successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

export const authRouter = router;
