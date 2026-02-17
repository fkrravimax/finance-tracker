
import api from './api';

export interface DashboardStats {
    totalBalance: number;
    income: number;
    expense: number;
    monthlyExpense: number;
    wallets?: { id: string; name: string; type: string; balance: number }[];
    budget: {
        limit: number;
        used: number;
        percentage: number;
    } | null;
}

import { encryptionService } from './encryptionService';

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        await encryptionService.ensureInitialized();
        const date = new Date();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Fetch data in parallel
        const [walletsRes, monthlyAggRes, budgetsRes] = await Promise.all([
            api.get('/wallets'),
            api.get(`/aggregates/monthly?monthKey=${monthKey}`),
            api.get('/budgets')
        ]);

        const walletsData = walletsRes.data;
        const monthlyAgg = monthlyAggRes.data; // Might be null or empty object if no agg yet
        const budgetsData = budgetsRes.data; // Array

        // 1. Calculate Total Balance from Wallets
        let totalBalance = 0;
        const processedWallets = walletsData.map((w: any) => {
            // Note: Wallet name is also encrypted in backend but sent as is? 
            // WalletService.getAll in backend DOES decrypt name and balance.
            // Wait, I saw wallet.service.ts refactor:
            // "name: cryptoService.decrypt(wallet.name)"
            // "balance: cryptoService.decryptToNumber(wallet.balance)"
            // So /wallets endpoint ALREADY returns decrypted data?
            // Let me re-verify wallet.service.ts
            // YES. walletService.getAll returns decrypted values.
            // So we don't need to decrypt wallet balance here, it's already a number?
            // "balance: cryptoService.decryptToNumber(wallet.balance)" -> returns number.
            return w;
        });

        // Check if wallet balance is number
        totalBalance = processedWallets.reduce((acc: number, w: any) => acc + Number(w.balance), 0);

        // 2. Process Monthly Aggregates (Encrypted)
        let income = 0;
        let expense = 0;

        if (monthlyAgg) {
            income = encryptionService.decryptToNumber(monthlyAgg.income);
            expense = encryptionService.decryptToNumber(monthlyAgg.expense);
        }

        const monthlyExpense = expense;
        const cashFlow = income - expense;
        const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

        // 3. Process Budget
        let budget = null;
        if (budgetsData && budgetsData.length > 0) {
            const b = budgetsData[0];
            // Budget limit is encrypted in DB? 
            // schema: limit: text("limit").notNull(). // Encrypted
            // Backend budget service probably returns it encrypted? 
            // I haven't checked budget.service.ts.
            // Let's assume it might be encrypted. Ideally backend decrypts for "getAll"?
            // If backend provides /budgets, does it decrypt?
            // Most "get" endpoints in this app seem to return decrypted data if they are for display.
            // BUT, the goal is privacy. "Zero Knowledge" implies backend shouldn't be able to decrypt everything without user key?
            // But we are using a shared key in env currently (Phase 1).
            // Wallet service decrypts.
            // Let's check budget service if possible, OR assume we handle both (try decrypt, if fail use as number).
            // Actually, `encryptionService.decryptToNumber` handles unencrypted numbers gracefully if we write it robustly?
            // My implementation checks for "iv:ciphertext". If not, returns text/0.

            // Let's assume budget is returned encrypted.
            // Wait, if /wallets returns decrypted, why refactor dashboard?
            // Because /dashboard/stats was calculating totals using SUM() on database, which FAILS on encrypted text columns.
            // /wallets works because it iterates and decrypts row by row (expensive but doing it).
            // /aggregates works because we store them.

            // So, `income` and `expense` from `monthlyAgg` OUGHT to be encrypted strings.
            // `wallets` from `/wallets` are likely decrypted numbers (based on previous file view).

            const limit = encryptionService.decryptToNumber(b.limit);
            // If b.limit is already number (because backend decrypted), decryptToNumber might return 0 if it expects string?
            // My decryptToNumber: "if (!text || !text.includes(':')) return text;" -> parseFloat(text).
            // So it handles plain numbers/strings fine.

            const percentage = limit > 0 ? Math.min(Math.round((monthlyExpense / limit) * 100), 100) : 0;

            budget = {
                limit,
                used: monthlyExpense,
                percentage
            };
        }

        return {
            totalBalance,
            income,
            expense,
            monthlyExpense,
            wallets: processedWallets,
            budget,
            // savingsRate // Type definition doesn't have savingsRate? 
            // Interface says: totalBalance, income, expense, monthlyExpense, wallets, budget.
            // No savingsRate in interface.
        };
    },
    setBudget: async (limit: number) => {
        const { data } = await api.post('/budgets', { limit });
        return data;
    },
    getReport: async (range: string = 'monthly') => {
        const { data } = await api.get(`/dashboard/report?range=${range}`);
        return data;
    }
};
