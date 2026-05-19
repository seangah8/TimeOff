import { body } from 'express-validator';
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
