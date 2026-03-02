import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Origin validation middleware.
 * Validates that state-changing requests (POST, PUT, PATCH, DELETE)
 * originate from trusted domains listed in the CORS whitelist.
 * GET/HEAD/OPTIONS are considered safe and are skipped.
 */

const TRUSTED_ORIGINS = [
    'https://rupiku.vercel.app',
    'https://finance-web-five-coral.vercel.app',
    'https://financetrx.vercel.app',
    'https://finance-web-git-main-rafis-projects-acb0d393.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
];

// Add FRONTEND_URL from env if set
if (process.env.FRONTEND_URL) {
    TRUSTED_ORIGINS.push(process.env.FRONTEND_URL);
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Skip safe methods
    if (SAFE_METHODS.includes(req.method)) {
        return next();
    }

    // Skip cron endpoints (protected by CRON_SECRET)
    if (req.path.startsWith('/api/cron')) {
        return next();
    }

    // Skip Better Auth internal endpoints (they handle their own CSRF)
    if (req.path.startsWith('/api/auth/')) {
        return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Check Origin header first (most reliable)
    if (origin) {
        if (TRUSTED_ORIGINS.includes(origin)) {
            return next();
        }
        console.warn(`[CSRF] Blocked request from untrusted origin: ${origin} → ${req.method} ${req.path}`);
        return res.status(403).json({ error: 'Forbidden: untrusted origin' });
    }

    // Fallback: check Referer header
    if (referer) {
        const refererOrigin = new URL(referer).origin;
        if (TRUSTED_ORIGINS.includes(refererOrigin)) {
            return next();
        }
        console.warn(`[CSRF] Blocked request from untrusted referer: ${refererOrigin} → ${req.method} ${req.path}`);
        return res.status(403).json({ error: 'Forbidden: untrusted origin' });
    }

    // No Origin or Referer — allow (some clients/tools don't send them; session auth still required)
    // This is the standard behavior per OWASP guidelines for Origin-based CSRF mitigation
    return next();
};
