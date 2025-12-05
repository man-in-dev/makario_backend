export const validate = (validator) => {
    return (req, res, next) => {
        const { error } = validator.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({
                success: false,
                message: errorMessage,
            });
        }

        next();
    };
};

