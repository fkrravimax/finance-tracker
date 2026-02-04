
import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (!session) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Attach user and session to request for controllers to use
        (req as any).user = session.user;
        (req as any).session = session.session;

        // Also attach to res.locals for better typing support in some controllers/views
        res.locals.user = session.user;
        res.locals.session = session.session;

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
