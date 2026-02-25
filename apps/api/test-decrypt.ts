import { db } from './src/db/index.js';
import { transactions } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
import { cryptoService } from "./src/services/encryption.service.js";

async function test() {
    console.log("Fetching all transactions to test decryption...");
    const userId = "O0LJvtV4u9psNRKO11xcumruzfRDrA7Z"; // Rafi's ID
    const userTxs = await db.select().from(transactions).where(eq(transactions.userId, userId));

    let badTxs = 0;
    for (const t of userTxs) {
        try {
            cryptoService.decryptToNumber(t.amount);
            cryptoService.decrypt(t.merchant);
            cryptoService.decrypt(t.description || '');
        } catch (e: any) {
            console.error(`Decryption failed for tx ${t.id} - Date: ${t.date.toISOString()} - Category: ${t.category}`);
            console.error(e.message);
            badTxs++;
        }
    }
    console.log(`Finished. Found ${badTxs} corrupted transactions out of ${userTxs.length}.`);
    process.exit(0);
}
test().catch(console.error);
