
import { Request, Response, NextFunction } from "express";
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from "better-auth/node";
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

// Helper to track activity
const trackActivity = (user: any) => {
    const now = new Date();
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;

    if (!lastActive || (now.getTime() - lastActive.getTime() > 5 * 60 * 1000)) {
        // Fire and forget update
        db.update(users)
            .set({ lastActiveAt: now })
            .where(eq(users.id, user.id))
            .catch(err => console.error("Failed to update lastActiveAt:", err));
    }
}

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

            trackActivity(session.user);
            return next();
        }

        // 2. Fallback: Check for Bearer token (manual Google OAuth)
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            // Optimization: Fetch Session AND User in one query
            const result = await db
                .select({
                    user: users,
                    session: sessions
                })
                .from(sessions)
                .innerJoin(users, eq(sessions.userId, users.id))
                .where(
                    and(
                        eq(sessions.token, token),
                        gt(sessions.expiresAt, new Date())
                    )
                )
                .limit(1);

            const data = result[0];

            if (data) {
                (req as any).user = data.user;
                (req as any).session = data.session;
                res.locals.user = data.user;
                res.locals.session = data.session;

                trackActivity(data.user);
                return next();
            }
        }

        return res.status(401).json({ error: "Unauthorized" });
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
