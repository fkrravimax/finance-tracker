import { db } from './src/db/index.js';
import { transactions } from './src/db/schema.js';
import { eq, desc, and, gte, lte } from "drizzle-orm";

async function test() {
    const all = await db.select().from(transactions);
    console.log("Total transactions:", all.length);
    if(all.length > 0) {
        const userId = all[0].userId;
        const startDate = new Date("2026-01-31T00:00:00.000Z");
        const endDate = new Date("2026-02-26T23:59:59.999Z");
        
        console.log("Testing user:", userId);
        console.log("Start:", startDate);
        console.log("End:", endDate);

        const result = await db.select()
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
            ));
        console.log("Result length:", result.length);
    }
    process.exit(0);
}
test();
