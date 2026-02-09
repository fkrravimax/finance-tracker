import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "https://rupiku.vercel.app", "https://finance-web-five-coral.vercel.app", "https://financetrx.vercel.app", "https://finance-web-git-main-rafis-projects-acb0d393.vercel.app", "http://localhost:5173", "http://localhost:5174"] : ["https://rupiku.vercel.app", "https://financetrx.vercel.app", "https://finance-web-git-main-rafis-projects-acb0d393.vercel.app", "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Auth Routes
app.all("/api/auth/*splat", toNodeHandler(auth));

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

import adminRoutes from './routes/admin.routes.js';
app.use('/api/admin', authMiddleware, adminRoutes);

import upgradeRoutes from './routes/upgrade.routes.js';
app.use('/api/upgrade-requests', authMiddleware, upgradeRoutes);

// Helper to keep cron alive
import { startCronJobs } from './cron.js';
// Only start cron in non-serverless environment or use Vercel Cron (different topic)
// For now, allow it but it might not run reliably on serverless
if (!process.env.VERCEL) {
    startCronJobs();
}


import aiRoutes from './routes/ai.routes.js';
app.use('/api/ai', authMiddleware, aiRoutes);

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
