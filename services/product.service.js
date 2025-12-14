import Product from '../models/Product.model.js';

export const productService = {
  /**
   * Create a new product
   */
  async createProduct(productData) {
    // Convert price and compareAtPrice to numbers
    const price = parseFloat(productData.price) || 0;
    const compareAtPrice = productData.compareAtPrice ? parseFloat(productData.compareAtPrice) : null;

    // Ensure at least one image is marked as featured
    const images = productData.images || [];
    if (images.length > 0 && !images.some(img => img.featured)) {
      images[0].featured = true;
    }

    const product = await Product.create({
      title: productData.title,
      description: productData.description || '',
      category: productData.category,
      sku: productData.sku,
      price,
      compareAtPrice,
      stock: parseInt(productData.stock) || 0,
      images,
      rating: parseFloat(productData.rating) || 0,
      reviewCount: parseInt(productData.reviewCount) || 0,
      features: productData.features || [],
      specifications: productData.specifications || {},
      nutritionalInfo: productData.nutritionalInfo || {},
      isActive: productData.isActive !== undefined ? productData.isActive : true,
    });

    return product.toJSON();
  },

  /**
   * Get all products with optional filters
   */
  async getProducts(filters = {}) {
    const query = {};

    // Filter by category
    if (filters.category) {
      query.category = filters.category;
    }

    // Filter by active status
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    // Search by title or SKU
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      products: products.map(product => {
        const { _id, __v, ...productData } = product;
        return {
          ...productData,
          id: _id.toString(),
          inStock: product.stock > 0,
          image: product.images?.find(img => img.featured)?.url || product.images?.[0]?.url || '',
          images: product.images?.map(img => img.url) || [],
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    const product = await Product.findById(productId).lean();

    if (!product) {
      throw new Error('Product not found');
    }

    const { _id, __v, ...productData } = product;
    return {
      ...productData,
      id: _id.toString(),
      inStock: product.stock > 0,
      image: product.images?.find(img => img.featured)?.url || product.images?.[0]?.url || '',
      images: product.images?.map(img => img.url) || [],
    };
  },

  /**
   * Get product by SKU
   */
  async getProductBySku(sku) {
    const product = await Product.findOne({ sku }).lean();

    if (!product) {
      throw new Error('Product not found');
    }

    const { _id, __v, ...productData } = product;
    return {
      ...productData,
      id: _id.toString(),
      inStock: product.stock > 0,
      image: product.images?.find(img => img.featured)?.url || product.images?.[0]?.url || '',
      images: product.images?.map(img => img.url) || [],
    };
  },

  /**
   * Update product
   */
  async updateProduct(productId, updateData) {
    const updateFields = {};

    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.category !== undefined) updateFields.category = updateData.category;
    if (updateData.sku !== undefined) updateFields.sku = updateData.sku;
    if (updateData.price !== undefined) updateFields.price = parseFloat(updateData.price) || 0;
    if (updateData.compareAtPrice !== undefined) {
      updateFields.compareAtPrice = updateData.compareAtPrice ? parseFloat(updateData.compareAtPrice) : null;
    }
    if (updateData.stock !== undefined) updateFields.stock = parseInt(updateData.stock) || 0;
    if (updateData.images !== undefined) {
      // Ensure at least one image is marked as featured
      const images = updateData.images || [];
      if (images.length > 0 && !images.some(img => img.featured)) {
        images[0].featured = true;
      }
      updateFields.images = images;
    }
    if (updateData.rating !== undefined) updateFields.rating = parseFloat(updateData.rating) || 0;
    if (updateData.reviewCount !== undefined) updateFields.reviewCount = parseInt(updateData.reviewCount) || 0;
    if (updateData.features !== undefined) updateFields.features = updateData.features;
    if (updateData.specifications !== undefined) updateFields.specifications = updateData.specifications;
    if (updateData.nutritionalInfo !== undefined) updateFields.nutritionalInfo = updateData.nutritionalInfo;
    if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive;

    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      throw new Error('Product not found');
    }

    const { _id, __v, ...productData } = product;
    return {
      ...productData,
      id: _id.toString(),
      inStock: product.stock > 0,
      image: product.images?.find(img => img.featured)?.url || product.images?.[0]?.url || '',
      images: product.images?.map(img => img.url) || [],
    };
  },

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    return { message: 'Product deleted successfully' };
  },

  /**
   * Update product stock
   */
  async updateStock(productId, stock) {
    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: { stock: parseInt(stock) || 0 } },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      throw new Error('Product not found');
    }

    const { _id, __v, ...productData } = product;
    return {
      ...productData,
      id: _id.toString(),
      inStock: product.stock > 0,
    };
  },
};

