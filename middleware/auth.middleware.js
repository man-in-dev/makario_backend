import { verifyToken } from '../config/jwt.js';
import { errorResponse } from '../utils/response.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.log('Authentication error:', error);
    return errorResponse(res, 'Authentication failed', 401);
  }
};

