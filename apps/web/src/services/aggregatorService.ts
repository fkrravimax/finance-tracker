
import api from './api';
import { encryptionService } from './encryptionService';

export interface AggregatePayload {
    monthly?: { monthKey: string, income: string, expense: string, version: number };
    daily?: { dayKey: string, income: string, expense: string };
    category?: { monthKey: string, category: string, type: string, amount: string };
}

export const aggregatorService = {
    // Prepare aggregates for a new transaction
    prepareAggregates: async (
        amount: number,
        type: 'income' | 'expense',
        date: Date,
        category: string
    ): Promise<AggregatePayload> => {
        await encryptionService.ensureInitialized();

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        // Fetch existing aggregates (encrypted) for this User
        // Note: We need endpoints that return SINGLE aggregate by ID/Keys, 
        // to avoid fetching ALL history.
        // I added getMonthly(key), getDaily(key), getCategory(key) in backend controller.

        // 1. Monthly
        let mIncome = 0;
        let mExpense = 0;
        let mVersion = 1;

        try {
            const { data: monthlyData } = await api.get(`/aggregates/monthly?monthKey=${monthKey}`);
            if (monthlyData) {
                mIncome = encryptionService.decryptToNumber(monthlyData.income);
                mExpense = encryptionService.decryptToNumber(monthlyData.expense);
                mVersion = monthlyData.version + 1;
            }
        } catch (e) {
            // Assume 404 or empty
        }

        if (type === 'income') mIncome += amount;
        else mExpense += amount;

        // 2. Daily
        let dIncome = 0;
        let dExpense = 0;
        try {
            const { data: dailyData } = await api.get(`/aggregates/daily?dayKey=${dayKey}`);
            if (dailyData) {
                dIncome = encryptionService.decryptToNumber(dailyData.income);
                dExpense = encryptionService.decryptToNumber(dailyData.expense);
            }
        } catch (e) {
            // Assume 404
        }

        if (type === 'income') dIncome += amount;
        else dExpense += amount;

        // 3. Category
        let cAmount = 0;
        try {
            const { data: catData } = await api.get(`/aggregates/categories?monthKey=${monthKey}`);
            // catData is array. Find specific one.
            if (Array.isArray(catData)) {
                const found = catData.find((c: any) => c.category === category && c.type === type);
                if (found) {
                    cAmount = encryptionService.decryptToNumber(found.amount);
                }
            }
        } catch (e) {
            // 404
        }
        cAmount += amount;

        // Encrypt and Return
        return {
            monthly: {
                monthKey,
                income: encryptionService.encrypt(mIncome),
                expense: encryptionService.encrypt(mExpense),
                version: mVersion
            },
            daily: {
                dayKey,
                income: encryptionService.encrypt(dIncome),
                expense: encryptionService.encrypt(dExpense)
            },
            category: {
                monthKey,
                category,
                type,
                amount: encryptionService.encrypt(cAmount)
            }
        };
    },

    // Prepare aggregates for an update
    prepareUpdate: async (
        oldTx: { amount: number, type: 'income' | 'expense', date: Date | string, category: string },
        newTx: { amount: number, type: 'income' | 'expense', date: Date | string, category: string }
    ): Promise<AggregatePayload> => {
        // Limitation: If date changes month/day, we currently only update the NEW date's aggregates.
        // The OLD date's aggregates will remain stale until a full recalculation.
        // Reason: Backend API currently accepts single aggregate set per request.

        // Calculate the net effect on the NEW date
        // If same month/day, we reverse old and add new.
        // If different, we just add new (and ignore removing from old for now, sadly).

        const oldDate = new Date(oldTx.date);
        const newDate = new Date(newTx.date);
        const isSameMonth = oldDate.getFullYear() === newDate.getFullYear() && oldDate.getMonth() === newDate.getMonth();
        const isSameDay = isSameMonth && oldDate.getDate() === newDate.getDate();

        // Start with base aggregates for NEW date
        const basePayload = await aggregatorService.prepareAggregates(newTx.amount, newTx.type, newDate, newTx.category);

        // If same timeframe, we can apply the "reversal" of the old transaction to the SAME aggregates
        if (isSameMonth) {
            // Decrypt the values we just prepared (which contain existing + new)
            // Then subtract old.

            // This is inefficient (encrypt then decrypt). 
            // Better: Refactor prepareAggregates to accept "delta" or "operations".
            // For now, let's just do the math by decrypting.

            const mIncome = encryptionService.decryptToNumber(basePayload.monthly!.income);
            const mExpense = encryptionService.decryptToNumber(basePayload.monthly!.expense);

            let finalMIncome = mIncome;
            let finalMExpense = mExpense;

            if (oldTx.type === 'income') finalMIncome -= oldTx.amount;
            else finalMExpense -= oldTx.amount;

            basePayload.monthly!.income = encryptionService.encrypt(finalMIncome);
            basePayload.monthly!.expense = encryptionService.encrypt(finalMExpense);

            if (isSameDay) {
                const dIncome = encryptionService.decryptToNumber(basePayload.daily!.income);
                const dExpense = encryptionService.decryptToNumber(basePayload.daily!.expense);
                let finalDIncome = dIncome;
                let finalDExpense = dExpense;

                if (oldTx.type === 'income') finalDIncome -= oldTx.amount;
                else finalDExpense -= oldTx.amount;

                basePayload.daily!.income = encryptionService.encrypt(finalDIncome);
                basePayload.daily!.expense = encryptionService.encrypt(finalDExpense);
            }

            // Categories: Only if same category and same month
            if (oldTx.category === newTx.category && oldTx.type === newTx.type) {
                const cAmount = encryptionService.decryptToNumber(basePayload.category!.amount);
                basePayload.category!.amount = encryptionService.encrypt(cAmount - oldTx.amount);
            }
        }

        return basePayload;
    },

    prepareDelete: async (
        tx: { amount: number, type: 'income' | 'expense', date: Date | string, category: string }
    ): Promise<AggregatePayload> => {
        // Just prepare but with negative amount? 
        // prepareAggregates adds. We want to subtract.
        // Let's reuse logic but mock the "add" as "subtract"?
        // No, 'amount' is usually unsigned in logic.
        // Let's implement manually.

        await encryptionService.ensureInitialized();
        const date = new Date(tx.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        // Monthly
        let mIncome = 0, mExpense = 0, mVersion = 1;
        try {
            const { data: monthlyData } = await api.get(`/aggregates/monthly?monthKey=${monthKey}`);
            if (monthlyData) {
                mIncome = encryptionService.decryptToNumber(monthlyData.income);
                mExpense = encryptionService.decryptToNumber(monthlyData.expense);
                mVersion = monthlyData.version + 1;
            }
        } catch (e) { }

        if (tx.type === 'income') mIncome -= tx.amount;
        else mExpense -= tx.amount;

        // Daily
        let dIncome = 0, dExpense = 0;
        try {
            const { data: dailyData } = await api.get(`/aggregates/daily?dayKey=${dayKey}`);
            if (dailyData) {
                dIncome = encryptionService.decryptToNumber(dailyData.income);
                dExpense = encryptionService.decryptToNumber(dailyData.expense);
            }
        } catch (e) { }

        if (tx.type === 'income') dIncome -= tx.amount;
        else dExpense -= tx.amount;

        // Category
        let cAmount = 0;
        try {
            const { data: catData } = await api.get(`/aggregates/categories?monthKey=${monthKey}`);
            if (Array.isArray(catData)) {
                const found = catData.find((c: any) => c.category === tx.category && c.type === tx.type);
                if (found) cAmount = encryptionService.decryptToNumber(found.amount);
            }
        } catch (e) { }
        cAmount -= tx.amount;

        return {
            monthly: {
                monthKey,
                income: encryptionService.encrypt(mIncome),
                expense: encryptionService.encrypt(mExpense),
                version: mVersion
            },
            daily: {
                dayKey,
                income: encryptionService.encrypt(dIncome),
                expense: encryptionService.encrypt(dExpense)
            },
            category: {
                monthKey,
                category: tx.category,
                type: tx.type,
                amount: encryptionService.encrypt(cAmount)
            }
        };
    }
};
