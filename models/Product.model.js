import mongoose from 'mongoose';

const productImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    default: '',
  },
  featured: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const specificationsSchema = new mongoose.Schema({
  weight: {
    type: String,
    default: '',
  },
  speciality: {
    type: String,
    default: '',
  },
  brand: {
    type: String,
    default: 'Makario',
  },
  countryOfOrigin: {
    type: String,
    default: 'India (Bihar)',
  },
  flavor: {
    type: String,
    default: '',
  },
  storage: {
    type: String,
    default: 'Cool, dry place',
  },
  type: {
    type: String,
    default: '',
  },
}, { _id: false });

const nutritionalInfoSchema = new mongoose.Schema({
  servingSize: {
    type: String,
    default: 'Per 5g serving',
  },
  calories: {
    type: String,
    default: '',
  },
  fat: {
    type: String,
    default: '',
  },
  protein: {
    type: String,
    default: '',
  },
  sugars: {
    type: String,
    default: '',
  },
  carbohydrates: {
    type: String,
    default: '',
  },
  ingredients: {
    type: String,
    default: '',
  },
}, { _id: false });

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: true,
    enum: ['Raw Makhana', 'Classic Makhana', 'Premium', 'Organic', 'Flavored', 'Gifting'],
    default: 'Raw Makhana',
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  compareAtPrice: {
    type: Number,
    default: null,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  images: {
    type: [productImageSchema],
    default: [],
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  features: {
    type: [String],
    default: [],
  },
  specifications: {
    type: specificationsSchema,
    default: {},
  },
  nutritionalInfo: {
    type: nutritionalInfoSchema,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Convert _id to id and remove __v in JSON output
productSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Indexes for faster queries
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for inStock
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Virtual for main image (featured image or first image)
productSchema.virtual('image').get(function () {
  const featuredImage = this.images.find(img => img.featured);
  if (featuredImage) {
    return featuredImage.url;
  }
  return this.images.length > 0 ? this.images[0].url : '';
});

// Virtual for images array (just URLs)
productSchema.virtual('imagesArray').get(function () {
  return this.images.map(img => img.url);
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;

