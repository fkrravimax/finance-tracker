
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, count } from 'drizzle-orm';
import pg from 'pg';
import { users, accounts, sessions, transactions } from './src/db/schema.ts';

const client = new pg.Pool({
    connectionString: "postgresql://neondb_owner:npg_FkKs6yfq3UuJ@ep-sparkling-hill-aiy0c191-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

const db = drizzle(client);

async function main() {
    console.log('Connecting to DB...');
    try {
        const allUsers = await db.select().from(users);
        console.log(`Found ${allUsers.length} users.`);
        allUsers.forEach(u => console.log(`User: ${u.id} - ${u.name} (${u.email})`));

        const allSessions = await db.select().from(sessions);
        console.log(`Found ${allSessions.length} sessions.`);
        allSessions.forEach(s => console.log(`Session: ${s.token} -> User ${s.userId}`));

        // Check transactions for each user
        for (const u of allUsers) {
            const txCount = await db.select({ count: count() }).from(transactions).where(eq(transactions.userId, u.id));
            console.log(`User ${u.name} has ${txCount[0].count} transactions.`);
        }

    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await client.end();
    }
}

main();
