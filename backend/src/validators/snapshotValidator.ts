import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

export const validateCreateSnapshot = [
  body('investmentId')
    .isInt({ min: 1 })
    .withMessage('Valid investment ID is required'),
  body('snapshotDate')
    .isISO8601()
    .withMessage('Valid snapshot date is required'),
  body('valueOriginal')
    .isFloat({ min: 0 })
    .withMessage('Value must be a positive number'),
  body('currency')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters'),
  body('status')
    .optional()
    .isString(),

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

export const validateBulkUpdate = [
  body('snapshots')
    .isArray({ min: 1 })
    .withMessage('Snapshots array is required'),
  body('snapshots.*.investmentId')
    .isInt({ min: 1 })
    .withMessage('Valid investment ID is required'),
  body('snapshots.*.snapshotDate')
    .isISO8601()
    .withMessage('Valid snapshot date is required'),
  body('snapshots.*.valueOriginal')
    .isFloat({ min: 0 })
    .withMessage('Value must be a positive number'),
  body('snapshots.*.currency')
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters'),

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

export const validateGetByInvestmentId = [
  param('investmentId')
    .isInt({ min: 1 })
    .withMessage('Valid investment ID is required'),

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

export const validateGetMonthlySnapshot = [
  query('month')
    .optional()
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/)
    .withMessage('Month must be in format YYYY-MM'),
  query('exchangeRateType')
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
