import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  image: {
    type: String,
    default: '',
  },
}, { _id: false });

const shippingInfoSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
}, { _id: false });

const paymentDetailsSchema = new mongoose.Schema({
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  cashfreeOrderId: {
    type: String,
    default: '',
  },
  cashfreePaymentId: {
    type: String,
    default: '',
  },
  cashfreePaymentStatus: {
    type: String,
    default: '',
  },
  cashfreePaymentSessionId: {
    type: String,
    default: '',
  },
}, { _id: false });

const shippingDetailsSchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    default: '',
  },
  trackingNumber: {
    type: String,
    default: '',
  },
  awbNumber: {
    type: String,
    default: '',
  },
  courierName: {
    type: String,
    default: '',
  },
  courierTrackingUrl: {
    type: String,
    default: '',
  },
  labelUrl: {
    type: String,
    default: '',
  },
  manifestUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'created', 'picked', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled'],
    default: 'pending',
  },
  estimatedDeliveryDate: {
    type: Date,
    default: null,
  },
  deliveredDate: {
    type: Date,
    default: null,
  },
  shipwayData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'Order must have at least one item',
    },
  },
  shippingInfo: {
    type: shippingInfoSchema,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online'],
    required: true,
  },
  paymentDetails: {
    type: paymentDetailsSchema,
    default: {},
  },
  shippingDetails: {
    type: shippingDetailsSchema,
    default: {},
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingCharge: {
    type: Number,
    default: 50,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  coupon: {
    type: String,
    default: null,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Convert _id to id and remove __v in JSON output
orderSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Generate orderId before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    this.orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// Index for faster queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ userEmail: 1, createdAt: -1 });
// orderId already has unique: true which creates an index automatically
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;

