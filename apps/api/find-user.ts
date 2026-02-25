import { db } from './src/db/index.js';
import { transactions, users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function test() {
    console.log("Finding user with many transactions...");
    const allUsers = await db.select().from(users);
    for (const u of allUsers) {
        const userTxs = await db.select().from(transactions).where(eq(transactions.userId, u.id));
        console.log(`User ${u.id} (${u.email}) has ${userTxs.length} txs`);
    }
    process.exit(0);
}
test().catch(console.error);
