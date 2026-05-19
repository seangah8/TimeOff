import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User';

export const registerValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name must be 50 characters or fewer'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(Object.values(UserRole)).withMessage('Role must be Requester or Validator'),
];

export const loginValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
];

export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.type === 'field' ? e.path : e.type, message: e.msg })),
    });
    return;
  }
  next();
}
