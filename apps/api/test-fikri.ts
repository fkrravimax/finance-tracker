import { db } from './src/db/index.js';
import { transactions } from './src/db/schema.js';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { cryptoService } from "./src/services/encryption.service.js";

async function test() {
    const userId = "PkthOWzSZ3mQVb8AbF6m5SoWOUVABOMS"; // ahmad.fikri.rrr@gmail.com
    console.log("Testing user:", userId);

    const userTxs = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));
    console.log(`Dates for all ${userTxs.length} txs:`);
    for (const t of userTxs) {
        console.log(t.date.toISOString(), t.type, t.category, cryptoService.decryptToNumber(t.amount));
    }

    const startDate = new Date("2026-01-31T00:00:00.000Z");
    const endDate = new Date("2026-02-26T16:59:59.999Z");
    const rawTransactions = await db.select().from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, startDate), lte(transactions.date, endDate)));
    console.log("Count Jan 31 - Feb 26:", rawTransactions.length);

    const startDate2 = new Date("2026-02-06T00:00:00.000Z");
    const rawTransactions2 = await db.select().from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, startDate2), lte(transactions.date, endDate)));
    console.log("Count Feb 6 - Feb 26:", rawTransactions2.length);

    process.exit(0);
}
test().catch(console.error);
