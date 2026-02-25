import { db } from './src/db/index.js';
import { transactions } from './src/db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { cryptoService } from "./src/services/encryption.service.js";

async function test() {
    const userId = "O0LJvtV4u9psNRKO11xcumruzfRDrA7Z"; // Rafi's ID
    const startDate2 = new Date("2026-02-05T17:00:00.000Z"); // Feb 06 local
    const endDate = new Date("2026-02-26T16:59:59.999Z");

    const rawTransactions2 = await db.select().from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, startDate2), lte(transactions.date, endDate)));

    let total2 = 0;
    rawTransactions2.forEach(t => {
        if (t.type === 'expense') {
            total2 += cryptoService.decryptToNumber(t.amount);
        }
    });
    console.log(`Feb 06 to Feb 26 Total: Rp ${total2}`);
    process.exit(0);
}
test().catch(console.error);
