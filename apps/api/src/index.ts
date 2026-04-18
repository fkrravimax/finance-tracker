import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Vercel's reverse proxy (required for secure cookies behind proxy)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "https://rupiku.vercel.app", "https://finance-web-five-coral.vercel.app", "https://financetrx.vercel.app", "https://finance-web-git-main-rafis-projects-acb0d393.vercel.app", "http://localhost:5173", "http://localhost:5174"] : ["https://rupiku.vercel.app", "https://financetrx.vercel.app", "https://finance-web-git-main-rafis-projects-acb0d393.vercel.app", "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ── Security Headers (CSP, anti-clickjack, etc.) ─────────────────────────────
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0'); // Modern approach: disable legacy filter
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'");
    next();
});

// ── CSRF Origin Validation ───────────────────────────────────────────────────
import { csrfMiddleware } from './middleware/csrf.middleware.js';
app.use(csrfMiddleware);

// ── Rate Limiting ────────────────────────────────────────────────────────────
// Global rate limit: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    skip: (req) => req.path.startsWith('/api/cron'), // Cron uses CRON_SECRET
});

// Strict rate limit for auth endpoints: 15 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' },
});

app.use(globalLimiter);

// Manual Google OAuth routes (bypasses Better Auth's cookie-based state)
import googleAuthRoutes from './routes/google-auth.routes.js';
app.use('/api/auth/google', authLimiter, googleAuthRoutes);

// Apply strict rate limit to Better Auth sign-in/sign-up endpoints
app.use('/api/auth/sign-in', authLimiter);
app.use('/api/auth/sign-up', authLimiter);

// Better Auth handler for email/password, sessions, etc.
app.all("/api/auth/*splat", toNodeHandler(auth));

// Body parser for all other routes
app.use(express.json({ limit: '10mb' }));

import transactionRoutes from './routes/transaction.routes.js';
import { authMiddleware } from './middleware/auth.middleware.js';
app.use('/api/transactions', authMiddleware, transactionRoutes);

import budgetRoutes from './routes/budget.routes.js';
app.use('/api/budgets', authMiddleware, budgetRoutes);

import dashboardRoutes from './routes/dashboard.routes.js';
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

import exportRoutes from './routes/export.routes.js';
app.use('/api/export', authMiddleware, exportRoutes);

import savingsGoalRoutes from './routes/savings-goal.routes.js';
app.use('/api/savings-goals', authMiddleware, savingsGoalRoutes);

import { recurringRoutes } from './routes/recurring.routes.js';
app.use('/api/recurring', authMiddleware, recurringRoutes);

import { resetRoutes } from './routes/reset.routes.js';
app.use('/api/reset', authMiddleware, resetRoutes);

import tradingRoutes from './routes/trading.routes.js';
app.use('/api/trading', authMiddleware, tradingRoutes);

import cryptoRoutes from './routes/crypto.routes.js';
app.use('/api/crypto', authMiddleware, cryptoRoutes);

import sessionRoutes from './routes/session.routes.js';
app.use('/api/sessions', authMiddleware, sessionRoutes);

import adminRoutes from './routes/admin.routes.js';
app.use('/api/admin', authMiddleware, adminRoutes);

import upgradeRoutes from './routes/upgrade.routes.js';
app.use('/api/upgrade-requests', authMiddleware, upgradeRoutes);

import cronRoutes from './routes/cron.routes.js';
app.use('/api/cron', cronRoutes); // Protected by CRON_SECRET within controller

// Helper to keep cron alive
import { startCronJobs } from './cron.js';
// Only start cron in non-serverless environment or use Vercel Cron (different topic)
// For now, allow it but it might not run reliably on serverless
if (!process.env.VERCEL) {
    startCronJobs();
}


import aiRoutes from './routes/ai.routes.js';
app.use('/api/ai', authMiddleware, aiRoutes);

import walletRoutes from './routes/wallet.routes.js';
app.use('/api/wallets', authMiddleware, walletRoutes);

import notificationRoutes from './routes/notification.routes.js';
app.use('/api/notifications', authMiddleware, notificationRoutes);

// GET /api/user/me — Return fresh user profile (role, plan, etc.)
// Works for BOTH cookie-based (Better Auth) and Bearer token (Google OAuth) sessions
// because authMiddleware handles both auth strategies.
app.get('/api/user/me', authMiddleware, (req, res) => {
    const user = (req as any).user;
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ user });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// ── Centralized Error Handler (must be last) ─────────────────────────────────
import { errorHandler } from './middleware/error.middleware.js';
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
