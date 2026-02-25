import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error with HTTP status code.
 * Used to throw known/expected errors that should return specific status codes.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Centralized error handling middleware.
 * Must be registered AFTER all routes in Express.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof AppError ? err.message : 'Internal server error';

    // Structured logging with request context
    console.error(`[ERROR] ${req.method} ${req.path}`, {
        statusCode,
        message: err.message,
        userId: (req as any).user?.id || res.locals?.user?.id || 'anonymous',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
}
