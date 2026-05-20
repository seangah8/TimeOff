import { body } from 'express-validator';
import { UserRole } from '../entities/User';

// Validation rules for POST /auth/register.
// .trim() removes surrounding whitespace before the length/empty checks run.
export const registerValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name must be 50 characters or fewer'),

  // Role must be exactly one of the two valid enum values.
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(Object.values(UserRole)).withMessage('Role must be Requester or Validator'),
];

// Validation rules for POST /auth/login.
// Only the name is needed — there are no passwords in this system.
export const loginValidators = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),
];
