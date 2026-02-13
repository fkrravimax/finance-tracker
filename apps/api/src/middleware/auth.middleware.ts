
import { Request, Response, NextFunction } from "express";
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from "better-auth/node";
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Try Better Auth cookie-based session first (email/password login)
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (session) {
            (req as any).user = session.user;
            (req as any).session = session.session;
            res.locals.user = session.user;
            res.locals.session = session.session;
            return next();
        }

        // 2. Fallback: Check for Bearer token (manual Google OAuth)
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            const [dbSession] = await db
                .select()
                .from(sessions)
                .where(
                    and(
                        eq(sessions.token, token),
                        gt(sessions.expiresAt, new Date())
                    )
                )
                .limit(1);

            if (dbSession) {
                const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.id, dbSession.userId))
                    .limit(1);

                if (user) {
                    (req as any).user = user;
                    (req as any).session = dbSession;
                    res.locals.user = user;
                    res.locals.session = dbSession;
                    return next();
                }
            }
        }

        return res.status(401).json({ error: "Unauthorized" });
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
