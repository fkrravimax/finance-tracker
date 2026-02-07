
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    const targetEmail = 'Rafi@gmail.com';

    console.log(`Checking for user ${targetEmail}...`);

    try {
        const allUsers = await db.select().from(users);
        console.log('--- Current Users in DB ---');
        allUsers.forEach(u => {
            console.log(`- ${u.name} (${u.email}) [Role: ${u.role}, Plan: ${u.plan}]`);
        });
        console.log('---------------------------');

        const user = allUsers.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());

        if (!user) {
            console.error(`User with email ${targetEmail} not found in the database.`);
            console.log("Please sign up with this email first, or provide the correct email address.");
            process.exit(1);
        }

        console.log(`Found user: ${user.name}. Promoting to ADMIN...`);

        await db.update(users)
            .set({
                role: 'ADMIN',
                plan: 'PLATINUM'
            })
            .where(eq(users.id, user.id));

        console.log(`Successfully promoted ${targetEmail} to ADMIN with PLATINUM plan.`);
        process.exit(0);
    } catch (error) {
        console.error('Error during operation:', error);
        process.exit(1);
    }
}

main();
