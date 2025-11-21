import { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';

export const validateUpdateRate = [
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('rate')
    .isFloat({ min: 0 })
    .withMessage('Rate must be a positive number'),
  body('type')
    .optional()
    .isIn(['OFFICIAL', 'PESSIMISTIC', 'OPTIMISTIC'])
    .withMessage('Invalid exchange rate type'),
  body('source')
    .optional()
    .isString()
    .withMessage('Source must be a string'),

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

export const validateGetHistory = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO date'),
  query('type')
    .optional()
    .isIn(['OFFICIAL', 'PESSIMISTIC', 'OPTIMISTIC'])
    .withMessage('Invalid exchange rate type'),

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
