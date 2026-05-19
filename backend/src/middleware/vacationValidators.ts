import { body } from 'express-validator';

export const submitValidators = [
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Start date must be a valid date (YYYY-MM-DD)'),

  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('End date must be a valid date (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (endDate < req.body.startDate) {
        throw new Error('End date must be on or after start date');
      }
      return true;
    }),
];

export const rejectValidators = [
  body('comment')
    .trim()
    .notEmpty().withMessage('A comment is required when rejecting a request'),
];
