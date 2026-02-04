import { recurringService } from './src/services/recurring.service';
import { db } from './src/db';

async function test() {
    console.log("Testing recurringService...");
    const userId = "DXR8ptUsBgXe1HAjZ8mprbBSst3DnFmY";

    try {
        console.log("Attempting GET...");
        const items = await recurringService.getAll(userId);
        console.log("GET Success:", items);
    } catch (error) {
        console.error("GET Failed:", error);
    }

    try {
        console.log("Attempting POST...");
        const item = await recurringService.create(userId, {
            name: "Test Trans",
            amount: "100000",
            frequency: "Monthly",
            date: 15,
            icon: "sync"
        } as any);
        console.log("POST Success:", item);
    } catch (error) {
        console.error("POST Failed:", error);
    }
    process.exit(0);
}

test();
