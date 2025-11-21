import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Country } from '../../../shared/types';

export const validateInvestment = [
  body('country')
    .isIn(Object.values(Country))
    .withMessage('Invalid country'),
  body('account')
    .notEmpty()
    .withMessage('Account is required'),
  body('description')
    .notEmpty()
    .withMessage('Description is required'),
  body('type')
    .notEmpty()
    .withMessage('Type is required'),
  body('codigo')
    .optional()
    .isString(),
  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid purchase date'),
  body('purchaseValueOriginal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase value must be positive'),
  body('maturityDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid maturity date'),
  
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
