import { body } from 'express-validator';

// Validation rules for POST /vacations (submitting a new request).
export const submitValidators = [
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Start date must be a valid date (YYYY-MM-DD)'),

  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('End date must be a valid date (YYYY-MM-DD)')
    // Custom rule that runs after the format check: endDate must not be before startDate.
    // req.body.startDate is already available here because express-validator runs rules sequentially.
    .custom((endDate, { req }) => {
      if (endDate < req.body.startDate) {
        throw new Error('End date must be on or after start date');
      }
      return true;
    }),
];

// Validation rules for PATCH /vacations/:id/reject.
// A comment is mandatory — a validator must always explain why a request was rejected.
export const rejectValidators = [
  body('comment')
    .trim()
    .notEmpty().withMessage('A comment is required when rejecting a request'),
];
