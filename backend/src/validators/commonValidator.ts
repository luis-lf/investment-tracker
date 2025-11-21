import { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';

/**
 * Validate ID parameter in route
 */
export const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }
    next();
  }
];

/**
 * Validate codigo parameter in route
 */
export const validateCodigoParam = [
  param('codigo')
    .notEmpty()
    .isString()
    .withMessage('Valid codigo is required'),

  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }
    next();
  }
];
