import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
import Order from '../models/Order.model.js';
import { generateToken } from '../config/jwt.js';

export const authService = {
    async register(userData) {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        // Prepare addresses array
        const addresses = userData.address ? [{
            street: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            pincode: userData.pincode || '',
            phone: userData.phone || '',
            label: 'home',
            isDefault: true,
        }] : [];

        // Create user
        const newUser = await User.create({
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            phone: userData.phone || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            pincode: userData.pincode || '',
            addresses: addresses,
        });

        // Convert to JSON to apply schema transformations
        const userJson = newUser.toJSON();

        // Generate token
        const token = generateToken({
            id: userJson.id,
            email: userJson.email,
        });

        return {
            user: userJson,
            token,
        };
    },

    async login(email, password) {
        // Find user with password field included
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new Error('Invalid email or password');
        }
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Convert to JSON to apply schema transformations
        const userJson = user.toJSON();

        // Generate token
        const token = generateToken({
            id: userJson.id,
            email: userJson.email,
        });

        return {
            user: userJson,
            token,
        };
    },

    async getProfile(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Convert to JSON to apply schema transformations
        return user.toJSON();
    },

    async updateProfile(userId, updateData) {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!user) {
            throw new Error('User not found');
        }

        // Convert to JSON to apply schema transformations
        return user.toJSON();
    },

    async getAllUsers(filters = {}) {
        const query = {};

        // Search by name or email
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } },
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

        const [users, total] = await Promise.all([
            User.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
        ]);

        // Get order statistics for each user
        const userIds = users.map(u => u._id);

        // Aggregate order statistics (only for users with orders)
        const orderStats = await Order.aggregate([
            {
                $match: {
                    userId: { $in: userIds, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    orderCount: { $sum: 1 },
                    totalSpend: { $sum: '$total' },
                    lastOrderDate: { $max: '$createdAt' },
                },
            },
        ]);

        // Create a map of userId to stats
        const statsMap = {};
        orderStats.forEach(stat => {
            if (stat._id) {
                statsMap[stat._id.toString()] = {
                    orderCount: stat.orderCount,
                    totalSpend: stat.totalSpend,
                    lastOrderDate: stat.lastOrderDate,
                };
            }
        });

        // Combine user data with order statistics
        const usersWithStats = users.map(user => {
            const { _id, __v, password, ...userData } = user;
            const stats = statsMap[_id.toString()] || {
                orderCount: 0,
                totalSpend: 0,
                lastOrderDate: null,
            };

            return {
                ...userData,
                id: _id.toString(),
                orders: stats.orderCount,
                totalSpend: stats.totalSpend,
                lastOrder: stats.lastOrderDate,
            };
        });

        return {
            users: usersWithStats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    },
};

