import express from 'express';
import { productController } from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validator.middleware.js';
import {
  createProductValidator,
  updateProductValidator,
  updateStockValidator,
} from '../validators/product.validator.js';

const router = express.Router();

// Get all products (public - for shop page)
router.get('/', productController.getProducts);

// Get product by ID (public - for product detail page)
router.get('/:id', productController.getProductById);

// Get product by SKU (public)
router.get('/sku/:sku', productController.getProductBySku);

// Create product (protected - admin only)
router.post('/', authenticate, validate(createProductValidator), productController.createProduct);

// Update product (protected - admin only)
router.put('/:id', authenticate, validate(updateProductValidator), productController.updateProduct);

// Delete product (protected - admin only)
router.delete('/:id', authenticate, productController.deleteProduct);

// Update product stock (protected - admin only)
router.patch('/:id/stock', authenticate, validate(updateStockValidator), productController.updateStock);

export default router;

