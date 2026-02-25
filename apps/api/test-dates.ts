import { db } from './src/db/index.js';
import { transactions } from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function test() {
    const userId = "O0LJvtV4u9psNRKO11xcumruzfRDrA7Z"; // Rafi's ID
    const userTxs = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));
    console.log(`Dates for all ${userTxs.length} txs:`);
    for (const t of userTxs) {
        console.log(t.date.toISOString(), t.type);
    }
    process.exit(0);
}
test().catch(console.error);
