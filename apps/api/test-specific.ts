import { db } from './src/db/index.js';
import { transactions, users } from './src/db/schema.js';
import { cryptoService } from "./src/services/encryption.service.js";
import { eq, and, gte, lte } from 'drizzle-orm';

async function test() {
    console.log("Finding user with amount 864311 or 825000...");
    const allUsers = await db.select().from(users);
    for (const u of allUsers) {
        const userTxs = await db.select().from(transactions).where(eq(transactions.userId, u.id));
        for (const t of userTxs) {
            try {
                const amount = cryptoService.decryptToNumber(t.amount);
                if (amount === 864311 || amount === 825000) {
                    console.log(`FOUND MATCH in user ${u.id} (${u.email})!`);

                    const startDate = new Date("2026-01-31T00:00:00.000Z");
                    const endDate = new Date("2026-02-26T16:59:59.999Z");
                    const rawTransactions = await db.select().from(transactions).where(and(eq(transactions.userId, u.id), gte(transactions.date, startDate), lte(transactions.date, endDate)));
                    console.log("Count Jan 31 - Feb 26:", rawTransactions.length);
                    process.exit(0);
                }
            } catch (e) { }
        }
    }
    console.log("User not found!");
    process.exit(0);
}
test().catch(console.error);
