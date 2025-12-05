export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Joi validation error
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            message: err.details[0].message,
        });
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired',
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        message,
    });
};

