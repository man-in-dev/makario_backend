import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: '',
  },
  pincode: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  phone: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: 'Phone number must be 10 digits',
    },
  },
  address: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: '',
  },
  pincode: {
    type: String,
    default: '',
  },
  addresses: {
    type: [addressSchema],
    default: [],
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Convert _id to id and remove __v in JSON output
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    
    // Convert address _id to id
    if (ret.addresses && Array.isArray(ret.addresses)) {
      ret.addresses = ret.addresses.map(addr => {
        if (addr._id) {
          addr.id = addr._id.toString();
          delete addr._id;
        }
        return addr;
      });
    }
    
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;

