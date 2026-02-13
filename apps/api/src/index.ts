import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
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

// Manual Google OAuth routes (bypasses Better Auth's cookie-based state)
import googleAuthRoutes from './routes/google-auth.routes.js';
app.use('/api/auth/google', googleAuthRoutes);

// Better Auth handler for email/password, sessions, etc.
app.all("/api/auth/*splat", toNodeHandler(auth));

// Body parser for all other routes
app.use(express.json());

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

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
