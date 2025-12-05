import { verifyToken } from '../config/jwt.js';

// Optional authentication - doesn't fail if no token, but sets req.user if token is valid
export const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const decoded = verifyToken(token);

      if (decoded) {
        req.user = decoded;
      }
    }

    // Always continue, even if no token or invalid token
    next();
  } catch (error) {
    console.log('Optional authentication error:', error);
    // Continue anyway - don't block the request
    next();
  }
};

