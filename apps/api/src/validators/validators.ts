import { z } from 'zod';

// ─── Transaction Schemas ────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
    amount: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive('Amount must be positive')),
    type: z.enum(['income', 'expense'], { message: "Type must be 'income' or 'expense'" }),
    merchant: z.string().min(1, 'Merchant is required').max(255),
    category: z.string().min(1, 'Category is required').max(100),
    date: z.string().min(1, 'Date is required'),
    icon: z.string().optional(),
    description: z.string().max(500).optional(),
});

export const updateTransactionSchema = z.object({
    amount: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive('Amount must be positive'))
        .optional(),
    type: z.enum(['income', 'expense']).optional(),
    merchant: z.string().min(1).max(255).optional(),
    category: z.string().min(1).max(100).optional(),
    date: z.string().optional(),
    icon: z.string().optional(),
    description: z.string().max(500).optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
});

// ─── Trading Schemas ────────────────────────────────────────────────────────

export const createTradeSchema = z.object({
    pair: z.string().min(1, 'Trading pair is required').max(50),
    type: z.enum(['LONG', 'SHORT'], { message: "Type must be 'LONG' or 'SHORT'" }),
    entryPrice: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive('Entry price must be positive')),
    closePrice: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive('Close price must be positive'))
        .optional(),
    amount: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive('Amount must be positive')),
    leverage: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().min(1, 'Leverage must be at least 1')),
    pnl: z.union([z.number(), z.string()])
        .transform((v) => Number(v)),
    notes: z.string().max(500).optional(),
});

export const depositWithdrawSchema = z.object({
    amount: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive('Amount must be positive')),
    convertedAmount: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive())
        .optional(),
});

// ─── Savings Goal Schemas ───────────────────────────────────────────────────

export const createSavingsGoalSchema = z.object({
    name: z.string().min(1, 'Goal name is required').max(255),
    targetAmount: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive('Target amount must be positive')),
    targetDate: z.string().min(1, 'Target date is required'),
    category: z.string().min(1, 'Category is required').max(100),
    image: z.string().optional(),
    icon: z.string().optional(),
});

export const updateSavingsAmountSchema = z.object({
    amount: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive('Amount must be positive')),
    type: z.enum(['deposit', 'withdraw'], { message: "Type must be 'deposit' or 'withdraw'" }),
});

// ─── Budget Schema ──────────────────────────────────────────────────────────

export const setBudgetSchema = z.object({
    limit: z.union([z.number(), z.string()])
        .transform((v) => Number(v))
        .pipe(z.number().positive('Budget limit must be positive')),
});
