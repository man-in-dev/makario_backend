import express from 'express';
import { shipwayController } from '../controllers/shipway.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { optionalAuthenticate } from '../middleware/optionalAuth.middleware.js';

const router = express.Router();

// Create shipment for an order (protected - admin/merchant only)
router.post('/orders/:orderId/create-shipment', authenticate, shipwayController.createShipment);

// Track a shipment (optional auth - customers can track their orders)
router.get('/orders/:orderId/track', optionalAuthenticate, shipwayController.trackShipment);

// Get shipping label (protected - admin/merchant only)
router.get('/orders/:orderId/label', authenticate, shipwayController.getLabel);

// Cancel a shipment (protected - admin/merchant only)
router.post('/orders/:orderId/cancel-shipment', authenticate, shipwayController.cancelShipment);

// Get available couriers for a pincode (public)
router.get('/couriers', shipwayController.getAvailableCouriers);

// Webhook endpoint (no auth required - Shipway will call this)
router.post('/webhook', shipwayController.handleWebhook);

export default router;

