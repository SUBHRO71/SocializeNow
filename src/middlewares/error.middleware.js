import { ApiError } from '../utils/ApiError.js';
import logger from '../config/logger.js';
import config from '../config/index.js';

const errorHandler = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Something went wrong";
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(val => ({
                field: val.path,
                message: val.message
            }));
            error = new ApiError(400, "Validation Error", errors);
        } else if (error.name === 'CastError') {
            error = new ApiError(400, "Invalid ID format");
        } else if (error.name === 'JsonWebTokenError') {
            error = new ApiError(401, "Invalid token");
        } else if (error.name === 'TokenExpiredError') {
            error = new ApiError(401, "Token expired");
        } else if (error.name === 'MulterError') {
            error = new ApiError(400, error.message);
        } else {
            error = new ApiError(statusCode, message, error?.errors || [], err.stack);
        }
    }

    const response = {
        ...error,
        message: error.message,
        ...(config.isDev ? { stack: error.stack } : {})
    };

    logger.error(`${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    if(config.isDev) logger.error(error.stack);

    return res.status(error.statusCode).json(response);
};

export { errorHandler };
