
import { db } from '../db/index.js';
import { transactions, budgets, wallets, savingsGoals, recurringTransactions, trades, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { cryptoService } from '../services/crypto.service.js';

async function migrate() {
    console.log("Starting encryption migration...");

    // 1. Transactions
    const allTransactions = await db.select().from(transactions);
    console.log(`Encrypting ${allTransactions.length} transactions...`);
    for (const t of allTransactions) {
        // Check if already encrypted (heuristic: looks like iv:content)
        if (t.amount.toString().includes(':') && t.amount.toString().length > 32) continue;

        await db.update(transactions).set({
            amount: cryptoService.encrypt(t.amount),
            merchant: cryptoService.encrypt(t.merchant),
            description: cryptoService.encrypt(t.description || '')
        }).where(eq(transactions.id, t.id));
    }

    // 2. Wallets
    const allWallets = await db.select().from(wallets);
    console.log(`Encrypting ${allWallets.length} wallets...`);
    for (const w of allWallets) {
        if (w.balance.toString().includes(':')) continue;
        await db.update(wallets).set({
            name: cryptoService.encrypt(w.name),
            balance: cryptoService.encrypt(w.balance)
        }).where(eq(wallets.id, w.id));
    }

    // 3. Budgets
    const allBudgets = await db.select().from(budgets);
    console.log(`Encrypting ${allBudgets.length} budgets...`);
    for (const b of allBudgets) {
        if (b.limit.toString().includes(':')) continue;
        await db.update(budgets).set({
            limit: cryptoService.encrypt(b.limit)
        }).where(eq(budgets.id, b.id));
    }

    // 4. Savings Goals
    const allGoals = await db.select().from(savingsGoals);
    console.log(`Encrypting ${allGoals.length} savings goals...`);
    for (const g of allGoals) {
        if (g.targetAmount.toString().includes(':')) continue;
        await db.update(savingsGoals).set({
            name: cryptoService.encrypt(g.name),
            targetAmount: cryptoService.encrypt(g.targetAmount),
            currentAmount: cryptoService.encrypt(g.currentAmount)
        }).where(eq(savingsGoals.id, g.id));
    }

    // 5. Recurring
    const allRecurring = await db.select().from(recurringTransactions);
    console.log(`Encrypting ${allRecurring.length} recurring transactions...`);
    for (const r of allRecurring) {
        if (r.amount.toString().includes(':')) continue;
        await db.update(recurringTransactions).set({
            name: cryptoService.encrypt(r.name),
            amount: cryptoService.encrypt(r.amount)
        }).where(eq(recurringTransactions.id, r.id));
    }

    // 6. Users (Trading Balance)
    const allUsers = await db.select().from(users);
    console.log(`Encrypting ${allUsers.length} users...`);
    for (const u of allUsers) {
        if (u.tradingBalance.toString().includes(':')) continue;
        await db.update(users).set({
            tradingBalance: cryptoService.encrypt(u.tradingBalance)
        }).where(eq(users.id, u.id));
    }

    // 7. Trades
    const allTrades = await db.select().from(trades);
    console.log(`Encrypting ${allTrades.length} trades...`);
    for (const t of allTrades) {
        if (t.amount.toString().includes(':')) continue;
        await db.update(trades).set({
            amount: cryptoService.encrypt(t.amount),
            entryPrice: cryptoService.encrypt(t.entryPrice),
            closePrice: t.closePrice ? cryptoService.encrypt(t.closePrice) : null,
            pnl: t.pnl ? cryptoService.encrypt(t.pnl) : null,
            notes: t.notes ? cryptoService.encrypt(t.notes) : null
        }).where(eq(trades.id, t.id));
    }

    console.log("Migration complete!");
    process.exit(0);
}

migrate().catch(e => {
    console.error("Migration failed:", e);
    process.exit(1);
});
