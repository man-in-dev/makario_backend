import express from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { optionalAuthenticate } from '../middleware/optionalAuth.middleware.js';

const router = express.Router();

// Create payment session (optional auth - for guest checkout)
router.post('/create-session', optionalAuthenticate, paymentController.createPaymentSession);

// Verify payment (optional auth)
router.post('/verify', optionalAuthenticate, paymentController.verifyPayment);

// Webhook endpoint (no auth required - Cashfree will call this)
router.post('/webhook', express.json(), paymentController.handleWebhook);

export default router;

