
import { db } from '../db/index.js';
import { users, transactions } from '../db/schema.js';
import { eq } from "drizzle-orm";
import { cryptoService } from '../services/encryption.service.js';
import { aggregateService } from '../services/aggregate.service.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const migrateAggregates = async () => {
    console.log('Starting Aggregate Migration...');

    // 1. Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users.`);

    for (const user of allUsers) {
        console.log(`Processing user: ${user.id} (${user.email})`);

        // 2. Fetch all transactions
        const userTransactions = await db.select().from(transactions).where(eq(transactions.userId, user.id));
        console.log(`  - Found ${userTransactions.length} transactions.`);

        // 3. Calculate Aggregates in Memory
        const monthlyAggs: Record<string, { income: number, expense: number }> = {};
        const dailyAggs: Record<string, { income: number, expense: number }> = {};
        const categoryAggs: Record<string, { [key: string]: number }> = {}; // monthKey -> "Category|Type" -> amount

        for (const t of userTransactions) {
            const amount = cryptoService.decryptToNumber(t.amount);
            const date = new Date(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            // Monthly
            if (!monthlyAggs[monthKey]) monthlyAggs[monthKey] = { income: 0, expense: 0 };
            if (t.type === 'income') monthlyAggs[monthKey].income += amount;
            else monthlyAggs[monthKey].expense += amount;

            // Daily
            if (!dailyAggs[dayKey]) dailyAggs[dayKey] = { income: 0, expense: 0 };
            if (t.type === 'income') dailyAggs[dayKey].income += amount;
            else dailyAggs[dayKey].expense += amount;

            // Category
            if (!categoryAggs[monthKey]) categoryAggs[monthKey] = {};
            const catKey = `${t.category}|${t.type}`;
            if (!categoryAggs[monthKey][catKey]) categoryAggs[monthKey][catKey] = 0;
            categoryAggs[monthKey][catKey] += amount;
        }

        // 4. Save to DB
        // Monthly
        for (const [key, val] of Object.entries(monthlyAggs)) {
            await aggregateService.upsertMonthly(user.id, key, {
                monthKey: key,
                income: cryptoService.encrypt(val.income.toString()),
                expense: cryptoService.encrypt(val.expense.toString()),
                version: 1
            });
        }
        console.log(`  - Upserted ${Object.keys(monthlyAggs).length} monthly aggregates.`);

        // Daily
        for (const [key, val] of Object.entries(dailyAggs)) {
            await aggregateService.upsertDaily(user.id, key, {
                dayKey: key,
                income: cryptoService.encrypt(val.income.toString()),
                expense: cryptoService.encrypt(val.expense.toString())
            });
        }
        console.log(`  - Upserted ${Object.keys(dailyAggs).length} daily aggregates.`);

        // Category
        let catCount = 0;
        for (const [mKey, cats] of Object.entries(categoryAggs)) {
            for (const [catType, amount] of Object.entries(cats)) {
                const [category, type] = catType.split('|');
                await aggregateService.upsertCategory(user.id, mKey, category, type, cryptoService.encrypt(amount.toString()));
                catCount++;
            }
        }
        console.log(`  - Upserted ${catCount} category aggregates.`);
    }

    console.log('Migration Completed!');
    process.exit(0);
};

migrateAggregates().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
