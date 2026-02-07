
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    const email = 'Rafi@gmail.com'; // Check exact casing from previous logs if needed, but let's try this
    // The previous log showed "Rafi@gmail.com" was promoted.

    console.log(`Verifying user ${email}...`);

    try {
        const user = await db.select().from(users).where(eq(users.email, email));

        if (user.length === 0) {
            console.error(`User with email ${email} not found.`);
            // Try lowercase
            const userLower = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
            if (userLower.length > 0) {
                console.log(`Found user with lowercase email: ${userLower[0].email}`);
                console.log(`Role: ${userLower[0].role}, Plan: ${userLower[0].plan}`);
            } else {
                console.log("User distinctively not found.");
            }
            process.exit(1);
        }

        console.log(`User Found: ${user[0].name} (${user[0].email})`);
        console.log(`Role: ${user[0].role}`);
        console.log(`Plan: ${user[0].plan}`);

        process.exit(0);
    } catch (error) {
        console.error('Error verifying user:', error);
        process.exit(1);
    }
}

main();
