import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from './schema.js';
import * as dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes("status=start") ? undefined : { rejectUnauthorized: false }, // Simple fix for many Neon/Vercel SSL issues
    connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
