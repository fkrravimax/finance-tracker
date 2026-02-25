import { db } from './src/db/index.js';
import { sessions } from './src/db/schema.js';
import axios from 'axios';

async function test() {
    console.log("Fetching session token...");
    const activeSessions = await db.select().from(sessions);
    if(activeSessions.length > 0) {
        const token = activeSessions[0].token;
        console.log("Using token:", token);
        
        try {
            const url = 'http://localhost:5000/api/transactions?startDate=2026-01-31T00:00:00.000Z&endDate=2026-02-26T16:59:59.999Z';
            console.log("Fetching:", url);
            const res = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log("Result length:", res.data.length);
        } catch (e: any) {
            console.error("API Error:");
            if (e.response) {
                console.error(e.response.status, e.response.data);
            } else {
                console.error(e.message);
            }
        }
    }
    process.exit(0);
}
test().catch(console.error);
