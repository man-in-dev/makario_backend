import { authService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const authController = {
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);
            console.log(`User registered: ${result.user.email}`);
            return successResponse(res, result, 'User registered successfully', 201);
        } catch (error) {
            console.log('Register error:', error.message);
            next(error);
        }
    },

    async login(req, res, next) {
        try {
            const result = await authService.login(req.body.email, req.body.password);
            console.log(`User logged in: ${result.user.email}`);
            return successResponse(res, result, 'Login successful');
        } catch (error) {
            console.log('Login error:', error.message);
            next(error);
        }
    },

    async getProfile(req, res, next) {
        try {
            const user = await authService.getProfile(req.user.id);
            return successResponse(res, { user }, 'Profile retrieved successfully');
        } catch (error) {
            console.log('Get profile error:', error.message);
            next(error);
        }
    },

    async updateProfile(req, res, next) {
        try {
            const user = await authService.updateProfile(req.user.id, req.body);
            console.log(`Profile updated for user: ${user.email}`);
            return successResponse(res, { user }, 'Profile updated successfully');
        } catch (error) {
            console.log('Update profile error:', error.message);
            next(error);
        }
    },

    async getAllUsers(req, res, next) {
        try {
            const filters = {
                search: req.query.search,
                page: req.query.page,
                limit: req.query.limit,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
            };

            const result = await authService.getAllUsers(filters);
            return successResponse(res, result, 'Users retrieved successfully');
        } catch (error) {
            console.log('Get all users error:', error.message);
            next(error);
        }
    },
};

