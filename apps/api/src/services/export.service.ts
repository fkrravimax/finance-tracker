
import { db } from '../db/index.js';
import { transactions, budgets, savingsGoals } from '../db/schema.js';
import { eq, and, like, desc, sql, gte, lte } from "drizzle-orm";
import ExcelJS from 'exceljs';

export const exportService = {
    async generateReport(userId: string, filters: { wallet?: string; startDate?: Date; endDate?: Date }) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FinTrack App';
        workbook.created = new Date();

        // 1. Audit Trail (Log)
        await this.addAuditTrail(workbook, userId, filters);

        // 2. Micro-Spending Analysis (< 15k expense)
        await this.addMicroSpending(workbook, userId, filters);

        // 3. Savings Milestone
        await this.addSavingsMilestone(workbook, userId);

        // 4. Budget Performance
        await this.addBudgetPerformance(workbook, userId, filters);

        // 5. Daily Average Analysis
        await this.addDailyAverage(workbook, userId, filters);

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

        const conditions = [eq(transactions.userId, userId)];
        if (filters.wallet) {
            conditions.push(like(transactions.description, `%via ${filters.wallet}%`));
        }
        const whereClause = and(...conditions);

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

    async addMicroSpending(workbook: ExcelJS.Workbook, userId: string, filters: any) {
        const sheet = workbook.addWorksheet('Micro-Spending Analysis');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Item', key: 'merchant', width: 20 },
            { header: 'Amount (< 15k)', key: 'amount', width: 15 },
        ];

        const conditions = [
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense'),
            sql`CAST(${transactions.amount} AS DECIMAL) < 15000`
        ];

        if (filters.wallet) {
            conditions.push(like(transactions.description, `%via ${filters.wallet}%`));
        }

        const whereClause = and(...conditions);

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

        const conditions = [
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense')
        ];

        if (filters.wallet) {
            conditions.push(like(transactions.description, `%via ${filters.wallet}%`));
        }

        const whereClause = and(...conditions);

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
    },

    async addDailyAverage(workbook: ExcelJS.Workbook, userId: string, filters: any) {
        const sheet = workbook.addWorksheet('Daily Average');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Total Spent (Rp)', key: 'spent', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        const conditions = [
            eq(transactions.userId, userId),
            eq(transactions.type, 'expense')
        ];

        if (filters.wallet) {
            conditions.push(like(transactions.description, `%via ${filters.wallet}%`));
        }

        const whereClause = and(...conditions);

        // Fetch all expenses to calculate daily totals
        const expenses = await db.select({
            date: transactions.date,
            amount: transactions.amount,
        }).from(transactions).where(whereClause).orderBy(transactions.date);

        if (expenses.length === 0) return;

        // Group by Date
        const dailyTotals: Record<string, number> = {};
        expenses.forEach(e => {
            const dateStr = e.date.toISOString().split('T')[0];
            if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
            dailyTotals[dateStr] += Number(e.amount);
        });

        // Calculate Range Stats
        const dates = Object.keys(dailyTotals).sort();
        const totalOverall = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        // We calculate average based on the number of days with spending for now, 
        // to avoid skewing if the user didn't use the app for a month. A more strict average 
        // would use (EndDate - StartDate) days.
        const daysWithSpending = dates.length;
        const average = daysWithSpending > 0 ? totalOverall / daysWithSpending : 0;

        // Populate Sheet
        sheet.addRow({ date: 'SUMMARY', spent: '', status: '' }).font = { bold: true };
        sheet.addRow({ date: 'Average / Day', spent: average }).font = { bold: true };
        sheet.addRow([]); // spacer
        sheet.addRow({ date: 'DAILY BREAKDOWN', spent: '', status: '' }).font = { bold: true };

        dates.forEach(date => {
            const amount = dailyTotals[date];
            let status = 'Normal';
            if (amount > average * 1.5) status = 'High';
            else if (amount < average * 0.5) status = 'Low';

            const row = sheet.addRow({
                date: date,
                spent: amount,
                status: status
            });

            if (status === 'High') {
                row.getCell('status').font = { color: { argb: 'FFFF0000' } }; // Red
            } else if (status === 'Low') {
                row.getCell('status').font = { color: { argb: 'FF00AA00' } }; // Green
            }
        });

        sheet.getRow(1).font = { bold: true };
    }
};
