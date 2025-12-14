import { productService } from '../services/product.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const productController = {
  /**
   * Create a new product
   */
  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      console.log(`Product created: ${product.sku} - ${product.title}`);
      return successResponse(res, { product }, 'Product created successfully', 201);
    } catch (error) {
      console.error('Create product error:', error.message);
      
      // Handle duplicate SKU error
      if (error.code === 11000 || error.message.includes('duplicate')) {
        return errorResponse(res, 'Product with this SKU already exists', 400);
      }
      
      return errorResponse(
        res,
        error.message || 'Failed to create product',
        500
      );
    }
  },

  /**
   * Get all products
   */
  async getProducts(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };

      const result = await productService.getProducts(filters);
      return successResponse(res, result, 'Products retrieved successfully');
    } catch (error) {
      console.error('Get products error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to retrieve products',
        500
      );
    }
  },

  /**
   * Get product by ID
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      return successResponse(res, { product }, 'Product retrieved successfully');
    } catch (error) {
      console.error('Get product by ID error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to retrieve product',
        error.message === 'Product not found' ? 404 : 500
      );
    }
  },

  /**
   * Get product by SKU
   */
  async getProductBySku(req, res, next) {
    try {
      const { sku } = req.params;
      const product = await productService.getProductBySku(sku);
      return successResponse(res, { product }, 'Product retrieved successfully');
    } catch (error) {
      console.error('Get product by SKU error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to retrieve product',
        error.message === 'Product not found' ? 404 : 500
      );
    }
  },

  /**
   * Update product
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);
      console.log(`Product updated: ${product.sku} - ${product.title}`);
      return successResponse(res, { product }, 'Product updated successfully');
    } catch (error) {
      console.error('Update product error:', error.message);
      
      // Handle duplicate SKU error
      if (error.code === 11000 || error.message.includes('duplicate')) {
        return errorResponse(res, 'Product with this SKU already exists', 400);
      }
      
      return errorResponse(
        res,
        error.message || 'Failed to update product',
        error.message === 'Product not found' ? 404 : 500
      );
    }
  },

  /**
   * Delete product
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      console.log(`Product deleted: ${id}`);
      return successResponse(res, null, 'Product deleted successfully');
    } catch (error) {
      console.error('Delete product error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to delete product',
        error.message === 'Product not found' ? 404 : 500
      );
    }
  },

  /**
   * Update product stock
   */
  async updateStock(req, res, next) {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      
      if (stock === undefined || stock === null) {
        return errorResponse(res, 'Stock quantity is required', 400);
      }

      const product = await productService.updateStock(id, stock);
      console.log(`Product stock updated: ${product.sku} - Stock: ${stock}`);
      return successResponse(res, { product }, 'Product stock updated successfully');
    } catch (error) {
      console.error('Update stock error:', error.message);
      return errorResponse(
        res,
        error.message || 'Failed to update stock',
        error.message === 'Product not found' ? 404 : 500
      );
    }
  },
};

