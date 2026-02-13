import { db } from './src/db/index.js';
import { recurringTransactions, users } from './src/db/schema.js';
import { cryptoService } from './src/services/encryption.service.js';
import { randomUUID } from 'crypto';

const seedRecurring = async () => {
    try {
        console.log('Seeding test recurring transactions...');

        // 1. Get the first user
        const allUsers = await db.select().from(users).limit(1);
        if (allUsers.length === 0) {
            console.error('No users found! Please create a user first.');
            process.exit(1);
        }
        const user = allUsers[0];
        console.log(`Using user: ${user.email} (${user.id})`);

        const now = new Date();

        // 2. Create a recurring transaction due TODAY (for process-recurring)
        // Set date to exactly now or slightly in the past to ensure it's picked up by `lte(now)`
        const todayDue = new Date(now);
        // Ensure it's slightly before "now" so lte() catches it if running immediately
        todayDue.setMinutes(todayDue.getMinutes() - 1);

        await db.insert(recurringTransactions).values({
            id: randomUUID(),
            userId: user.id,
            name: cryptoService.encrypt('Test Recurring Due Today'),
            amount: cryptoService.encrypt(50000),
            frequency: 'Monthly',
            date: todayDue.getDate(),
            icon: '⚡',
            nextDueDate: todayDue,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`Created: Test Recurring Due Today (${todayDue.toISOString()})`);

        // 3. Create a recurring transaction due TOMORROW (for recurring-reminder)
        const tomorrowDue = new Date(now);
        tomorrowDue.setDate(tomorrowDue.getDate() + 1);
        // Ensure it has same time as "now" roughly

        await db.insert(recurringTransactions).values({
            id: randomUUID(),
            userId: user.id,
            name: cryptoService.encrypt('Test Recurring Due Tomorrow'),
            amount: cryptoService.encrypt(100000),
            frequency: 'Monthly',
            date: tomorrowDue.getDate(),
            icon: '📅',
            nextDueDate: tomorrowDue,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`Created: Test Recurring Due Tomorrow (${tomorrowDue.toISOString()})`);

        console.log(`Created: Test Recurring Due Tomorrow (${tomorrowDue.toISOString()})`);

        console.log('Seed complete! Exiting in 2 seconds...');
        setTimeout(() => process.exit(0), 2000);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seedRecurring().catch(err => console.error('Unhandled seed error:', err));
