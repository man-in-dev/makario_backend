import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
    registerValidator,
    loginValidator,
    updateProfileValidator,
} from '../validators/auth.validator.js';

const router = express.Router();

// Public routes
router.post('/register', validate(registerValidator), authController.register);
router.post('/login', validate(loginValidator), authController.login);

// Protected routes
router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(updateProfileValidator), authController.updateProfile);

export default router;

