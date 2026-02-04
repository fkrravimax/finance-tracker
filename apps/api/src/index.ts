import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        "https://finance-web-five-coral.vercel.app", // Explicit production domain
        process.env.FRONTEND_URL || "",               // Env var (if set)
        "http://localhost:5173",
        "http://localhost:5174"
    ].filter(Boolean), // Remove empty strings
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Auth Routes
app.all("/api/auth/*", toNodeHandler(auth));

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

// Helper to keep cron alive
import { startCronJobs } from './cron.js';
// Only start cron in non-serverless environment or use Vercel Cron (different topic)
// For now, allow it but it might not run reliably on serverless
if (!process.env.VERCEL) {
    startCronJobs();
}

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
