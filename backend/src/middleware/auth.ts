import { Request, Response, NextFunction } from 'express';
import { JWTUtil, JWTPayload } from '../utils/jwt';
import { AppError } from './errorHandler';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 * Extracts token from Authorization header and verifies it
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = JWTUtil.verifyToken(token);

    // Attach user info to request
    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication - attaches user if token is valid but doesn't fail if missing
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = JWTUtil.verifyToken(token);
      req.user = payload;
    }

    next();
  } catch {
    // Ignore auth errors for optional auth
    next();
  }
};
