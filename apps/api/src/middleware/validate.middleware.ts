import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with structured error details on validation failure.
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const parsed = schema.parse(req.body);
            // Replace body with parsed (transformed) data
            req.body = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map((e: any) => ({
                    field: (e.path as (string | number)[]).join('.'),
                    message: e.message as string,
                }));
                res.status(400).json({
                    error: 'Validation failed',
                    details: errors,
                });
                return;
            }
            next(error);
        }
    };
};
