import { Router } from 'express';
import * as vacationController from '../controllers/vacationController';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { handleValidationErrors } from '../../middleware/handleValidationErrors';
import { submitValidators, rejectValidators } from '../../middleware/vacationValidators';
import { UserRole } from '../../entities/User';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole(UserRole.Requester),
  submitValidators,
  handleValidationErrors,
  vacationController.submit,
);

router.get(
  '/me',
  authenticate,
  requireRole(UserRole.Requester),
  vacationController.getOwn,
);

router.get(
  '/',
  authenticate,
  requireRole(UserRole.Validator),
  vacationController.getAll,
);

router.get(
  '/stats',
  authenticate,
  requireRole(UserRole.Validator),
  vacationController.getStats,
);

router.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.Requester),
  vacationController.deleteRequest,
);

router.patch(
  '/:id/approve',
  authenticate,
  requireRole(UserRole.Validator),
  vacationController.approve,
);

router.patch(
  '/:id/reject',
  authenticate,
  requireRole(UserRole.Validator),
  rejectValidators,
  handleValidationErrors,
  vacationController.reject,
);

export default router;
