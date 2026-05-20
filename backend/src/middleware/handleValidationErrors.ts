import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Reads the validation errors collected by the preceding express-validator rules.
// If any field failed, responds with 422 and a list of field-level messages so
// the client knows exactly what to fix. If everything passed, calls next() to
// continue to the actual route handler.
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((e) => ({
        field: e.type === 'field' ? e.path : e.type,
        message: e.msg,
      })),
    });
    return;
  }
  next();
}
