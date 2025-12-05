import bcrypt from 'bcrypt';
import User from '../models/User.model.js';
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
};

