
import { db } from '../db/index.js';
import { transactions, budgets, savingsGoals } from '../db/schema.js';
import { eq, and, desc, gte, lte } from "drizzle-orm";
import ExcelJS from 'exceljs';
import { cryptoService } from "./encryption.service.js";

export const exportService = {
    async generateReport(userId: string, filters: { wallet?: string; startDate?: Date; endDate?: Date }) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FinTrack App';
        workbook.created = new Date();

        // --- 1. Fetch & Decrypt Data Once ---

        // A. Transactions
        const txConditions = [eq(transactions.userId, userId)];
        if (filters.startDate) {
            txConditions.push(gte(transactions.date, filters.startDate));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            txConditions.push(lte(transactions.date, end));
        }

        const rawTransactions = await db.select().from(transactions)
            .where(and(...txConditions))
            .orderBy(desc(transactions.date));

        const decryptedTransactions = rawTransactions.map(t => ({
            ...t,
            amount: cryptoService.decryptToNumber(t.amount),
            merchant: cryptoService.decrypt(t.merchant),
            description: cryptoService.decrypt(t.description || ''),
        }));

        // Apply Wallet Filter (Description Regex)
        let filteredTransactions = decryptedTransactions;
        if (filters.wallet) {
            const walletRegex = new RegExp(`\\(via ${filters.wallet}\\)`, 'i');
            filteredTransactions = decryptedTransactions.filter(t =>
                walletRegex.test(t.description)
            );
        }

        // B. Savings Goals
        const rawGoals = await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
        const decryptedGoals = rawGoals.map(g => ({
            ...g,
            name: cryptoService.decrypt(g.name),
            targetAmount: cryptoService.decryptToNumber(g.targetAmount),
            currentAmount: cryptoService.decryptToNumber(g.currentAmount),
        }));


        // --- 2. Generate Sheets using Processed Data ---

        // 1. Audit Trail (Log)
        this.addAuditTrail(workbook, filteredTransactions);

        // 2. Micro-Spending Analysis (< 15k expense)
        this.addMicroSpending(workbook, filteredTransactions);

        // 3. Savings Milestone
        this.addSavingsMilestone(workbook, decryptedGoals);

        // 4. Budget Performance
        this.addBudgetPerformance(workbook, filteredTransactions);

        // 5. Daily Average Analysis
        this.addDailyAverage(workbook, filteredTransactions);

        return workbook;
    },

    addAuditTrail(workbook: ExcelJS.Workbook, data: any[]) {
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

        data.forEach(t => {
            // Extract wallet from description pattern "Notes (via Wallet)"
            const walletMatch = t.description?.match(/\(via (Bank|Cash|E-wallet)\)/);
            const wallet = walletMatch ? walletMatch[1] : '-';

            sheet.addRow({
                date: t.date,
                type: t.type,
                amount: t.amount,
                category: t.category,
                merchant: t.merchant,
                description: t.description,
                wallet: wallet
            });
        });

        // Styling
        sheet.getRow(1).font = { bold: true };
    },

    addMicroSpending(workbook: ExcelJS.Workbook, data: any[]) {
        const sheet = workbook.addWorksheet('Micro-Spending Analysis');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Item', key: 'merchant', width: 20 },
            { header: 'Amount (< 15k)', key: 'amount', width: 15 },
        ];

        // Filter for expenses < 15000
        const microExpenses = data.filter(t => t.type === 'expense' && t.amount < 15000);

        microExpenses.forEach(t => {
            sheet.addRow({
                date: t.date,
                category: t.category,
                merchant: t.merchant,
                amount: t.amount
            });
        });

        const totalRow = sheet.addRow({ merchant: 'TOTAL LEAKAGE', amount: microExpenses.reduce((sum, t) => sum + t.amount, 0) });
        totalRow.font = { bold: true, color: { argb: 'FFFF0000' } };
        sheet.getRow(1).font = { bold: true };
    },

    addSavingsMilestone(workbook: ExcelJS.Workbook, goals: any[]) {
        const sheet = workbook.addWorksheet('Savings Milestone');
        sheet.columns = [
            { header: 'Goal Name', key: 'name', width: 20 },
            { header: 'Target (Rp)', key: 'target', width: 15 },
            { header: 'Current (Rp)', key: 'current', width: 15 },
            { header: 'Progress (%)', key: 'progress', width: 15 },
            { header: 'Target Date', key: 'date', width: 15 },
        ];

        goals.forEach(g => {
            const target = g.targetAmount;
            const current = g.currentAmount;
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

    addBudgetPerformance(workbook: ExcelJS.Workbook, data: any[]) {
        const sheet = workbook.addWorksheet('Budget Performance');
        sheet.columns = [
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Total Spent (Rp)', key: 'spent', width: 20 },
            { header: 'Transaction Count', key: 'count', width: 15 },
        ];

        // Group expenses by category
        const expenses = data.filter(t => t.type === 'expense');
        const categorySummary: Record<string, { total: number, count: number }> = {};

        expenses.forEach(e => {
            const cat = e.category;
            if (!categorySummary[cat]) categorySummary[cat] = { total: 0, count: 0 };
            categorySummary[cat].total += e.amount;
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

    addDailyAverage(workbook: ExcelJS.Workbook, data: any[]) {
        const sheet = workbook.addWorksheet('Daily Average');
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Total Spent (Rp)', key: 'spent', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        // Fetch all expenses to calculate daily totals
        const expenses = data
            .filter(t => t.type === 'expense')
            // Sort by date ascending for the report (already desc in fetch, so reverse)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (expenses.length === 0) return;

        // Group by Date
        const dailyTotals: Record<string, number> = {};
        expenses.forEach(e => {
            try {
                const dateStr = new Date(e.date).toISOString().split('T')[0];
                if (!dailyTotals[dateStr]) dailyTotals[dateStr] = 0;
                dailyTotals[dateStr] += e.amount;
            } catch (e) {
                // Ignore invalid dates
            }
        });

        // Calculate Range Stats
        const dates = Object.keys(dailyTotals).sort();
        const totalOverall = expenses.reduce((sum, e) => sum + e.amount, 0);
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
