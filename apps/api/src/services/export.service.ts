
import { db } from "../db";
import { transactions, budgets, savingsGoals } from "../db/schema";
import { eq, and, like, desc, sql, gte, lte } from "drizzle-orm";
import ExcelJS from 'exceljs';

export const exportService = {
    async generateReport(userId: string, filters: { wallet?: string; startDate?: Date; endDate?: Date }) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FinTrack App';
        workbook.created = new Date();

        // 1. Audit Trail (Log)
        await this.addAuditTrail(workbook, userId, filters);

        // 2. Bocor Halus Analysis (< 20k expense)
        await this.addBocorHalus(workbook, userId, filters);

        // 3. Savings Milestone
        await this.addSavingsMilestone(workbook, userId);

        // 4. Budget Performance
        await this.addBudgetPerformance(workbook, userId, filters);

        return workbook;
    },

    async addAuditTrail(workbook: ExcelJS.Workbook, userId: string, filters: any) {
        const sheet = workbook.addWorksheet('Audit Trail');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Amount (Rp)', key: 'amount', width: 15 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Merchant', key: 'merchant', width: 20 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Wallet Source', key: 'wallet', width: 15 },
        ];

        let whereClause = eq(transactions.userId, userId);
        if (filters.wallet) {
            whereClause = and(whereClause, like(transactions.description, `%via ${filters.wallet}%`));
        }

        const data = await db.select().from(transactions).where(whereClause).orderBy(desc(transactions.date));

        data.forEach(t => {
            // Extract wallet from description pattern "Notes (via Wallet)"
            const walletMatch = t.description?.match(/\(via (Bank|Cash|E-wallet)\)/);
            const wallet = walletMatch ? walletMatch[1] : '-';

            sheet.addRow({
                date: t.date,
                type: t.type,
                amount: Number(t.amount),
                category: t.category,
                merchant: t.merchant,
                description: t.description,
                wallet: wallet
            });
        });

        // Styling
        sheet.getRow(1).font = { bold: true };
    },

    async addBocorHalus(workbook: ExcelJS.Workbook, userId: string, filters: any) {
        const sheet = workbook.addWorksheet('Bocor Halus Analysis');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Item', key: 'merchant', width: 20 },
            { header: 'Amount (< 20k)', key: 'amount', width: 15 },
        ];

        let whereClause = and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense'),
            sql`CAST(${transactions.amount} AS DECIMAL) < 20000`
        );

        if (filters.wallet) {
            whereClause = and(whereClause, like(transactions.description, `%via ${filters.wallet}%`));
        }

        const data = await db.select().from(transactions).where(whereClause).orderBy(desc(transactions.date));

        data.forEach(t => {
            sheet.addRow({
                date: t.date,
                category: t.category,
                merchant: t.merchant,
                amount: Number(t.amount)
            });
        });

        const totalRow = sheet.addRow({ merchant: 'TOTAL LEAKAGE', amount: data.reduce((sum, t) => sum + Number(t.amount), 0) });
        totalRow.font = { bold: true, color: { argb: 'FFFF0000' } };
        sheet.getRow(1).font = { bold: true };
    },

    async addSavingsMilestone(workbook: ExcelJS.Workbook, userId: string) {
        const sheet = workbook.addWorksheet('Savings Milestone');
        sheet.columns = [
            { header: 'Goal Name', key: 'name', width: 20 },
            { header: 'Target (Rp)', key: 'target', width: 15 },
            { header: 'Current (Rp)', key: 'current', width: 15 },
            { header: 'Progress (%)', key: 'progress', width: 15 },
            { header: 'Target Date', key: 'date', width: 15 },
        ];

        const goals = await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));

        goals.forEach(g => {
            const target = Number(g.targetAmount);
            const current = Number(g.currentAmount);
            const progress = target > 0 ? (current / target) * 100 : 0;

            sheet.addRow({
                name: g.name,
                target: target,
                current: current,
                progress: `${progress.toFixed(1)}%`,
                date: g.targetDate
            });
        });

        sheet.getRow(1).font = { bold: true };
    },

    async addBudgetPerformance(workbook: ExcelJS.Workbook, userId: string, filters: any) {
        const sheet = workbook.addWorksheet('Budget Performance');
        sheet.columns = [
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Total Spent (Rp)', key: 'spent', width: 20 },
            { header: 'Transaction Count', key: 'count', width: 15 },
        ];

        // Group expenses by category
        // TODO: This is a simplified view since we only have one Global Budget Limit in schema currently,
        // not per-category budgets. So we list spending per category.

        // Logic: specific category budget vs actual is requested, but schema only supports global budget now.
        // We will show "Spending by Category" which is the closest calculation.

        let whereClause = and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense')
        );

        if (filters.wallet) {
            whereClause = and(whereClause, like(transactions.description, `%via ${filters.wallet}%`));
        }

        const expenses = await db.select({
            category: transactions.category,
            amount: transactions.amount,
        }).from(transactions).where(whereClause);

        const categorySummary: Record<string, { total: number, count: number }> = {};

        expenses.forEach(e => {
            const cat = e.category;
            if (!categorySummary[cat]) categorySummary[cat] = { total: 0, count: 0 };
            categorySummary[cat].total += Number(e.amount);
            categorySummary[cat].count += 1;
        });

        Object.keys(categorySummary).forEach(cat => {
            sheet.addRow({
                category: cat,
                spent: categorySummary[cat].total,
                count: categorySummary[cat].count
            });
        });

        sheet.getRow(1).font = { bold: true };
    }
};
