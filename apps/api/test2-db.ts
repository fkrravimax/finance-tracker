import { db } from './src/db/index.js';
import { transactions } from './src/db/schema.js';
import { eq, desc, and, gte, lte } from "drizzle-orm";

async function test() {
    console.log("Starting test...");
    const all = await db.select().from(transactions);
    console.log("Total transactions:", all.length);
    if(all.length > 0) {
        const userId = all[0].userId;
        const startDate = new Date("2026-01-31T00:00:00.000Z");
        const endDate = new Date("2026-02-26T23:59:59.999Z");
        
        console.log("Testing userId:", userId);
        const result = await db.select()
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
            ));
        console.log("Count with early start:", result.length);

        const startDate2 = new Date("2026-02-06T00:00:00.000Z");
        const result2 = await db.select()
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                gte(transactions.date, startDate2),
                lte(transactions.date, endDate)
            ));
        console.log("Count with late start:", result2.length);

        console.log("All dates for user:");
        const userDates = await db.select({ date: transactions.date }).from(transactions).where(eq(transactions.userId, userId));
        userDates.forEach(r => console.log(r.date.toISOString()));
    }
    process.exit(0);
}
test().catch(e => console.error(e));
