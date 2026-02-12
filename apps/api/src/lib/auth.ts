import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
        }
    }),
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "USER",
                input: false // Don't allow user to set this
            },
            plan: {
                type: "string",
                required: false,
                defaultValue: "FREE",
                input: false // Don't allow user to set this
            }
        }
    },
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }
    },
    trustedOrigins: [
        process.env.FRONTEND_URL || "http://localhost:5173",
        "https://rupiku.vercel.app",
        "https://finance-web-five-coral.vercel.app",
        "https://financetrx.vercel.app",
        "https://finance-web-git-main-rafis-projects-acb0d393.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    baseURL: process.env.BETTER_AUTH_URL,
    advanced: {
        crossSubDomainCookies: {
            enabled: false,
        },
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
            path: "/",
        },
        useSecureCookies: true,
        cookies: {
            session_token: {
                name: "better-auth.session_token",
                attributes: {
                    sameSite: "none" as const,
                    secure: true,
                    path: "/",
                },
            },
        },
    }
});
