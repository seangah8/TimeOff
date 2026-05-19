import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../../middleware/auth';
import { registerValidators, loginValidators } from '../../middleware/authValidators';
import { handleValidationErrors } from '../../middleware/handleValidationErrors';

const router = Router();

router.post('/register', registerValidators, handleValidationErrors, authController.register);
router.post('/login', loginValidators, handleValidationErrors, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
